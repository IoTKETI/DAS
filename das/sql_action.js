/**
 * Copyright (c) 2019, KDDI Research, Inc.
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

//var responder = require('./responder');
var moment = require('moment');
var util = require('util');
//var merge = require('merge');
//var fs = require('fs');

var db = require('./db_action');

var _this = this;
// 以下の２つのフラグはglobal変数にする
var bq_flg = "`";
var sq_flg = "'";

//global.max_lim = 1000;

// MYSQLのチューニング
exports.set_tuning = function(callback) {
    var sql = util.format('set global max_connections = 2000');
    db.getResult(sql, '', function (err, results) {
        if(err) {
            //callback(err, results);
            //return;
            console.log(results.message);
        }
        sql = util.format('set global innodb_flush_log_at_trx_commit=0');
        db.getResult(sql, '', function (err, results) {
            if(err) {
                //callback(err, results);
                //return;
                console.log(results.message);
            }
            sql = util.format('set global sync_binlog=0');
            db.getResult(sql, '', function (err, results) {
                if(err) {
                    //callback(err, results);
                    //return;
                    console.log(results.message);
                }
                sql = util.format('set global transaction_isolation=\'READ-UNCOMMITTED\'');
                db.getResult(sql, '', function (err, results) {
                    if(err) {
                        //callback(err, results);
                        //return;
                        console.log(results.message);
                    }
                    callback(err, results);
                });
            });
        });
    });
};


//
// まず、マスターであるlookupテーブルにinsert_lookup()でデータを追加する（全てのリソース：acp,cs,ae,cnt(tokenは別途管理用テーブルが必要かも）
// リソースの追加が成功したら、db.getResult()にsql文を引数として渡し、各リソーステーブルに受信データを追加する
// 各リソーステーブルの追加が成功したら、正常終了し、追加が失敗したら、lookupテーブルに追加したリソースデータを削除する。（CSEのリソースIDはどうする？）
// riを使用してlookupテーブルにアクセスしているが、DASはriの代わりにurlを利用する！

////////////////////////// DB Table info ////////////////////////////////////
/*
■lookup				
カラム	日本語名	例					PK	外部key
url	URL		//kddi.jp/cse-id/cse-base/sensor_ae	○	
ty	リソースタイプ	2		
sri	リソースID	rkm3nZ7m3G		
ct	作成日時			
lt	更新日時			
or	作成者（要求元）					○	

■cb				
カラム	日本語名	例					PK	外部key
url	URL		//kddi.jp/cse-id/cse-base		○	○
rn	リソース名	cse-base		
csi	CSE-ID		/cse-id		

■ae				
カラム		日本語名	例					PK	外部key
url		URL		//kddi.jp/cse-id/cse-base/sensor_ae	○	○
rn		リソース名	sensor_ae
aei		AE-ID		S20180417070045277BCV0
class		AEの種類	サービス or デバイス
usr		user_id		user_idを格納（デバイス時）
name		表示名		サービス名、デバイスの表示名
datatypes	データ種別ID	取得するデータID
type		サービスの種類	0～359
policy		ポリシー	"{
  ""policy"": [
    {
      ""data_id"" : ""DATA0001"",
      ""required_flag"" : true,
      ""purpose"" : ""PURPOSE01""
    },{
      ""data_id"": ""DATA0003"",
      ""required_flag"" : false,
      ""purpose"" : ""PURPOSE03""
    }
  ]
}"		

■cnt				
カラム		日本語名	例						PK	外部key
url		URL		//kddi.jp/cse-id/cse-base/sensor_ae/humidity	○	○
rn		リソース名	humidity
datatypes	データ種別ID	データ種別ID
pae		親AE		//kddi.jp/cse-id/cse-base/sensor_ae

■acp				
カラム		日本語名		例			PK	外部key
trid		対象のリソース					○	○
or		リクエスト元					○	○
acop		許可オペレーション
pl		有効時間
actw		accessControWindow アクセス制御時間帯
acip_ipv4	accessControlIpAddresses
acip_ipv6	accessControlIpAddresses
aclr		accessControlLocationRegion
acaf		accessControlAuthenticationFlag
ct		作成日時
lt		更新日時
usr		ユーザID
*/				
////////////////////////// Table info ////////////////////////////////////

// lookupテーブルについて

exports.insert_lookup = function(obj, callback) {
    console.log('insert_lookup ');
    // resourceの情報をlookupテーブルに格納する
    var ct = moment().utc().format('YYYY-MM-DD HH:mm:ss');
    var lt = ct;

///// ORIGINATORはちゃんと設定する（X-M2M-RI　あるいはX-M2M-ORIGIN
///// 6.4.7 X-M2M-Origin
///// The X-M2M-Origin header shall be mapped to the From parameter of request and response primitives and vice versa, if applicable.
///// The X-M2M-Origin header value shall be assigned by the Originator of the request (e.g. AE or CSE).
///// 6.4.8 X-M2M-RI
///// The X-M2M-RI header shall be mapped to the Request Identifier parameter of request and response primitives and vice versa. ）

///// console.log('X-M2M-Origin: ' + request.headers['x-m2m-origin']);
/*
    var sql = util.format('insert into lookup (' +
        'url, ty, sri, ct, lt, or) ' +
        'values (\'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\')',
        obj.url, obj.ty, obj.sri, ct, lt, obj.or);
*/
    // optionパラメータに対応すること
    var sql = util.format('insert into lookup ' +
        'values (\'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\')',
        obj.url, obj.ty, obj.sri, ct, lt, obj.or);

/*
var sql = util.format('select * from lookup');
*/
console.log(sql);
    db.getResult(sql, '', function (err, results) {
        if(!err) {
//            set_sri_sri(obj.ri, obj.sri, function (err, results) {
                //console.log('insert_lookup ' + obj.ri);
                callback(err, results);
//            });
        }
        else {
            callback(err, results);
        }
    });
};

// INSERT

/// ACPはLookupテーブルを参照する(mysqlの制約でcascadeモード）が、登録はしない
exports.insert_acp = function(obj, callback) {
    console.log('insert_acp ');
//    var ct = moment().add(1, 'd').utc().format('YYYY-MM-DD HH:mm:ss');
    var ct = moment().utc().format('YYYY-MM-DD HH:mm:ss');
    var lt = ct;
/* (この書式だと何故かエラーになる）
    var sql = util.format('insert into acp (trid, or, policy, ct, lt, usr) ' +
        'value (\'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\')',
         obj.trid, obj.or, JSON.stringify(obj.policy), ct, lt, obj.usr);
*/
    // この書式はOK。
    // optionパラメータに対応すること。usrは存在しないケースがあるので注意。
    var sql = util.format('insert into acp ' +
        'value (\'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\')',
         obj.trid, obj.or, JSON.stringify(obj.policy), ct, lt, obj.usr);
    db.getResult(sql, '', function (err, results) {
            console.log('insert_acp ' + obj.ri);
            callback(err, results);
    });
};

// insert_ae関数内で、insert_into_lookup/delete from lookup するのはどうかと。
exports.insert_ae = function(obj, callback) {
     console.log('insert_ae ');
    _this.insert_lookup(obj, function (err, results) {
        if(!err) {
            // optionパラメータに対応すること（必須パラメータ：url, rn, aei、それ以外はオプション）
            var sql = util.format('insert into ae (url, rn, aei, class, usr, name, datatypes, type, policy) ' +
                'value (\'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\', \'%s\')',
                obj.url, obj.rn, obj.sri, obj.class, obj.usr, obj.name, JSON.stringify(obj.datatypes), obj.type, JSON.stringify(obj.policy));
            db.getResult(sql, '', function (err, results) {
                if(!err) {
                    console.log('insert_ae ' + obj.ri);
                    callback(err, results);
                }
                else {
                    sql = util.format("delete from lookup where ri = \'%s\'", obj.ri);
                    db.getResult(sql, '', function () {
                    });
                    callback(err, results);
                }
            });
        }
        else {
            callback(err, results);
        }
    });
};

// insert_cnt関数内で、delete from lookup するのはどうかと。
exports.insert_cnt = function(obj, callback) {
    console.log('insert_cnt ' + obj.ri);
    _this.insert_lookup(obj, function (err, results) {
        if(!err) {
	    // optionパラメータに対応すること（必須パラメータは、url, rn, cnti、但しpaeはurlから取得。datatypesのみオプション）
            var sql = util.format('insert into cnt (url, rn, cnti, datatypes, pae) ' +
                'value (\'%s\', \'%s\', \'%s\', \'%s\')',
                obj.url, obj.rn, obj.sri, obj.datatypes, obj.pae);

            db.getResult(sql, '', function (err, results) {
                if(!err) {
                    console.log('insert_cnt ' + obj.ri);
                    callback(err, results);
                }
                else {
                    sql = util.format("delete from lookup where ri = \'%s\'", obj.ri);
                    db.getResult(sql, '', function () {
                        callback(err, results);
                    });
                }
            });
        }
        else {
            callback(err, results);
        }
    });
};


exports.insert_cb = function(obj, callback) {
    console.log('insert_cb ');
    _this.insert_lookup(obj, function (err, results) {
        if(!err) {
            var sql = util.format('insert into cb (' +
                'url, rn,  csi) ' +
                'value (\'%s\', \'%s\', \'%s\')',
                obj.url, obj.rn, obj.sri);
            db.getResult(sql, '', function (err, results) {
                if(!err) {
                    console.log('insert_cb ' + obj.ri);
                    callback(err, results);
                }
                else {
                    // 
                    sql = util.format("delete from lookup where ri = \'%s\'", obj.ri);
                    db.getResult(sql, '', function () {
                        callback(err, results);
                    });
                }
            });
        }
        else {
            callback(err, results);
        }
    });
};
// SELECT

// like検索はdataset必要かどうかは微妙。
/*
exports.select_csr_like = function(cb, callback) {
    var sql = util.format("select * from csr where ri like \'/%s/%%\'", cb);
    db.getResult(sql, '', function (err, results_csr) {
        if (!Array.isArray(results_csr.poa)) {
            results_csr.poa = [];
        }
        callback(err, results_csr);
    });
};
*/
// Dynamic Authorization APIは、テーブルアクセスはACPのテーブルを参照するだけ。
// lookup tableからurlに一致するレコードを取得
// このtyをキーにして、削除テーブルを決定する→パスを解析してリソースが決定できるロジックがあれば、そのロジックを利用する手もある。

exports.select_lookup = function(uri, callback) {
    console.log('select_lookup');
    var sql = util.format("select * from lookup where url = \'%s\'", uri);
    db.getResult(sql, '', function (err, results) {
//        console.log(direct_Obj['ty']);
        callback(err, results);
    });
};

exports.select_ty_lookup = function(uri, callback) {
    console.log('select_ty_lookup');
    var sql = util.format("select ty from lookup where url = \'%s\'", uri);
    db.getResult(sql, '', function (err, results) {
        callback(err, results);
    });
};

exports.select_acp = function(trid, or, callback) {
    console.log('select_acp');
    var sql = util.format("select * from acp where trid = \'%s\' and " + "`" + "or"+ "`"+" = \'%s\'", trid, or);
    console.log(sql);
    db.getResult(sql, '', function (err, results) {
        callback(err, results);
    });
};

exports.select_acplist = function(request , callback) {
    // trid, or, usrは全てオプション。存在する場合は、完全一致。
    // orはSQL文では予約語なので、"`"で囲む必要がある
    // データの値も「'」で囲む必要あり
    console.log('select_acplist');
    sql = "select * from acp";
    where = "";
    params = request.query;
    console.log(params);
    bq_flg = "`";
    sq_flg = "'";
    if(params){
        for(var param_name in params){
            if(!where){
                where = " where "+ bq_flg + param_name + bq_flg + " = " + sq_flg + params[param_name] + sq_flg;
            }
            else{
                where = where + " and " + bq_flg + param_name + bq_flg + " = " + sq_flg + params[param_name] + sq_flg;
            }
        }
    }
    sql = sql + where;

    db.getResult(sql, '', function (err, results) {
        callback(err, results);
    });
};

exports.select_rec = function(uri, table, callback) {
    console.log('select_rec');
    var sql = util.format("select * from "+ table + " where url = \'%s\'", uri);
    db.getResult(sql, '', function (err, results) {
        callback(err, results);
    });
};

// 受信したデータのフィールド名とDBの列名が異なるケースがあるので、注意。特に、sriはそれぞれ、csi、aei、cntiに変換してDBに保持する。また、結果表示の際は、逆変換が必要。
exports.select_reclist  = function(request , callback) {
    // ty, class,usr, name, datatype(ae,cnt用）, type, pae((aeおよび)cnt検索用？AEの親もAEの可能性はある)は全てオプション。存在する場合は、datatype以外は完全一致。
    // SQL文では予約語をフィールド名で利用する場合は、"`"で囲む必要がある
    // データの値も「'」で囲む必要あり
    console.log('select_reclist');
    console.log(request.query['ty']);
    // ty毎に「テーブルを変更する
    ty = request.query['ty'];

//    search_fields = {'ty','sri','class','usr','name','datatype','type','policy'};
	// ae/cnt/cseの場合は、各テーブルを参照して、オプションパラメータと一致するデータを取得する。余計なオプションパラメータは無視。
        // ty=2:aeのケースは、class,name,datatype, type,policyをチェック
        // ty=3:cntのケースは、datatype,paeのみチェック
        // ty=5:CSEのケースは、オプションパラメータは無視。
    ae_params = ['class','name','datatype', 'type','policy'];
    cnt_params = ['datatype', 'pae'];
    data_params = request.query;

    if(ty == 2){
        console.log('Search from ae');
        sql = "select url,aei from ae";
        // オプションデータをwhere文でつなげる
        where = "";
	if(data_params){
            for(var param_name in data_params){ // key:value pairのkeyを取得
		if(ae_params.includes(param_name)){　// keyがオプションパラメータに含まれるか検査
                        operator = " = ";
                        if(param_name == 'datatype'){
			    // 部分一致
　　　　　　　　　　　　　　operator = " like ";
                            param_name = 'datatypes';
			}
                	if(!where){
                    	    where = " where "+"`"+ param_name +"`"+ operator + "'" +params[param_name]+"'";
                	}
                	else{
                    	    where = where + " and "+"`" + param_name +"`"+ operator + "'" +params[param_name]+"'";
                	}
            	}
            }
	}
        sql = sql + where;
        console.log('sql = ', sql);
    	db.getResult(sql, '', function (err, results) {
            data_list=JSON.parse(JSON.stringify(results));
	    console.log("before:");
	    console.log(data_list);
            var response_data = [];
	    data_list.forEach(function(data) {
	        var newHashmap = {};
	        Object.keys(data).forEach(function(key){
    		    var value = data[key];
		    console.log(key);
		    if(key == 'url'){
			newHashmap[key] = value;
			newHashmap['ty'] = ty;
		    }else if (key == 'aei'){
			newHashmap['sri'] = value;
    		    }
	        });
                response_data.push(newHashmap);
            });
	    console.log("after:");
	    console.log(response_data);
	    callback('1', JSON.stringify(response_data));
        });
    }
    else if ( ty == 3 ){
        console.log('Search from cnt');
        sql = "select url,cnti from cnt";
        // オプションデータをwhere文でつなげる

        where = "";
	if(data_params){
            for(var param_name in data_params){ // key:value pairのkeyを取得
		if(cnt_params.includes(param_name)){　// keyがオプションパラメータに含まれるか検査
                        operator = " = ";
                        if(param_name == 'datatype'){
			    // 部分一致
　　　　　　　　　　　　　　operator = " like ";
                            param_name = 'datatypes';
			}
                	if(!where){
                    	    where = " where "+"`"+ param_name +"`"+ operator + "'" +params[param_name]+"'";
                	}
                	else{
                    	    where = where + " and "+"`" + param_name +"`"+ operator + "'" +params[param_name]+"'";
                	}
            	}
            }
	}
        sql = sql + where;
        console.log('sql = ', sql);
    	db.getResult(sql, '', function (err, results) {
	    // ここで結果が空の場合や、エラーの場合の処理を追加
            data_list=JSON.parse(JSON.stringify(results));
	    var response_data = [];
	    data_list.forEach(function(data) {
	        var newHashmap = {};
	        Object.keys(data).forEach(function(key){
    		    var value = data[key];
		    console.log(key);
		    if(key == 'url'){
			newHashmap[key] = value;
			newHashmap['ty'] = ty;
		    }else if (key == 'cnti'){
			newHashmap['sri'] = value;
    		    }
	        });
                response_data.push(newHashmap);
            });
	    callback('1', JSON.stringify(response_data));
        });
    }
    else if ( ty == 5 ){
        console.log('Search from cb');
        sql = "select url,csi from cb";
    	db.getResult(sql, '', function (err, results) {
            data_list=JSON.parse(JSON.stringify(results));
	    var response_data = [];
	    data_list.forEach(function(data) {
	        var newHashmap = {};
	        Object.keys(data).forEach(function(key){
    		    var value = data[key];
		    console.log(key);
		    if(key == 'url'){
			newHashmap[key] = value;
			newHashmap['ty'] = ty;
		    }else if (key == 'csi'){
			newHashmap['sri'] = value;
    		    }
	        });
                response_data.push(newHashmap);
            });
	    callback('1', JSON.stringify(response_data));
        });
    }
    else {
	// tyが無い場合は、lookupテーブルから該当するデータを取得する
        console.log('Search from lookup');
        sql = "select url,ty,sri from lookup";
    	db.getResult(sql, '', function (err, results) {
            data_list=JSON.parse(JSON.stringify(results));
	    console.log(data_list);
	    callback('1', JSON.stringify(data_list));
        });
    }
};


exports.select_cb = function(uri, callback) {
    var sql = util.format("select * from cb where url = \'%s\'", uri);
    db.getResult(sql, '', function (err, results) {
        callback(err, results);
    });
};

exports.select_ae = function(uri, callback) {
    var sql = util.format("select * from ae where url = \'%s\'", uri);
    db.getResult(sql, '', function (err, results) {
        callback(err, results);
    });
};

exports.select_cnt = function(uri, callback) {
    var sql = util.format("select * from cnt where url = \'%s\'", uri);
    db.getResult(sql, '', function (err, results) {
        callback(err, results);
    });
};

// 更新

exports.update_cs = function (obj, callback) {
    callback(0, 'CSE can not be updated');
}

// lookupテーブルの日時更新
exports.update_lookup_lt_date = function(obj, callback) {
    var lt = moment().utc().format('YYYY-MM-DD HH:mm:ss');
    var sql = util.format('update lookup set lt = \'%s\' where url = \'%s\'', obj.url, lt);
    db.getResult(sql, '', function (err, results) {
        //console.log('update_lookup ' + ri);
        callback(err, results);
    });
};

// データのエラーチェックを完全にやっていない
exports.update_acp = function (obj, callback) {
    console.log('update_acp ' + obj.ri);
    // usrpolicy(acop,pl以外）はオプション。ltは時間を更新する
    var lt = moment().utc().format('YYYY-MM-DD HH:mm:ss');
    var sql = util.format('update acp set usr = \'%s\', policy = \'%s\', lt = \'%s\' where `trid` = \'%s\' and `or` = \'%s\'',
       obj.usr, JSON.stringify(obj.policy), lt, obj.trid, obj.or);
    // sqlに返されたstatus codeやデータなどを元に検索結果を解析する
    console.log(sql);
    db.getResult(sql, '', function (err, results) {
           if (!err) {
               // UpdateしたACPの最新情報を返信
               console.log('acp data updated');
               callback(err, results);
           }
           else {
               callback(err, results);
           }
    });
};

exports.update_ae = function (obj, callback) {
    console.log('update_ae');
//    console.log('update_ae ' + obj.ri);
//    _this.update_lookup(obj, function (err, results) {
//        if (!err) {
            // パラメータが存在しない場合は、sql文字列には含めない（要対応 2019/9/10）
            var sql = util.format('update ae set class = \'%s\', usr = \'%s\', name = \'%s\', datatypes = \'%s\', type = \'%s\', policy = \'%s\' where url = \'%s\'',
                obj.class, obj.usr, obj.name, obj.datatypes, obj.type, JSON.stringify(obj.policy), obj.url);
            db.getResult(sql, '', function (err, results) {
                if (!err) {
                    update_lookup_lt_date(obj, function(err, results) {
	                    callback(err, results);
		    });
                    callback(err, results);
                }
                else {
                    callback(err, results);
                }
            });
};

exports.update_cnt = function (obj, callback) {
//    var cnt_id = 'update_cnt ' + obj.ri + ' - ' + require('shortid').generate();
//    console.log(cnt_id);
//    _this.update_lookup(obj, function (err, results) {
//        if (!err) {
            var sql = util.format('update cnt set datatypes = \'%s\' where url = \'%s\'',
                obj.datatypes, obj.url);
            db.getResult(sql, '', function (err, results) {
                if (!err) {
                    update_lookup_lt_date(obj, function(err, results) {
	                    callback(err, results);
		    });
                    callback(err, results);
                }
                else {
                    callback(err, results);
                }
            });
//        }
//        else {
//            callback(err, results);
//        }
//    });
};

// 削除

exports.delete_lookup = function (uri, callback) {
    var sql = util.format("DELETE FROM lookup WHERE url = \'%s\'", uri);
    //console.log(sql);
    db.getResult(sql, '', function (err, results) {
        // DELETE時も削除した情報を返す（削除前にgetして、返信用のデータを用意しておく必要がある）
        // DELETEに失敗した場合は、その旨エラーを返す（HTTP Error code = 500)
        callback(err, results);
    });
};

exports.delete_rce = function (uri, table, callback){
    var sql = util.format("DELETE FROM "+table+" WHERE url = \'%s\'", uri);
    //console.log(sql);
    db.getResult(sql, '', function (err, results) {
        // DELETE時も削除した情報を返す（削除前にgetして、返信用のデータを用意しておく必要がある）
        // DELETEに失敗した場合は、その旨エラーを返す（HTTP Error code = 500)
        callback(err, results);
    });
};
