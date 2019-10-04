/**
 * Copyright (c) 2019, KDDI Research, Inc.
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var url = require('url');
var http = require('http');
var https = require('https');
var moment = require('moment');
var fs = require('fs');
var responder = require('./responder');
var db_sql = require('./sql_action');
var _this = this;

exports.remove_no_value = function (request, resource_Obj) {
    console.log('remove no value');

    var rootnm = request.headers.rootnm;

    for (var index in resource_Obj[rootnm]) {
        if (resource_Obj[rootnm].hasOwnProperty(index)) {
            if (request.hash) {
                if (request.hash.split('#')[1] == index) {

                }
                else {
                    delete resource_Obj[rootnm][index];
                }
            }
            else {　// 以下、resourceのtype checkをしているが、boolean型と、number型は処理が一緒なので、まとめられる。
                if (typeof resource_Obj[rootnm][index] === 'boolean') {
                    resource_Obj[rootnm][index] = resource_Obj[rootnm][index].toString();
                }
                else if (typeof resource_Obj[rootnm][index] === 'string') {
                    if (resource_Obj[rootnm][index] == '' || resource_Obj[rootnm][index] == 'undefined' || resource_Obj[rootnm][index] == '[]') {
                        if (resource_Obj[rootnm][index] == '' && index == 'pi') {
                            resource_Obj[rootnm][index] = null;
                        }
                        else {
                            delete resource_Obj[rootnm][index];
                        }
                    }
                }
                else if (typeof resource_Obj[rootnm][index] === 'number') {
                    resource_Obj[rootnm][index] = resource_Obj[rootnm][index].toString();
                }
            }
        }
    }
};

function regist_action(request, response, ty, resource_Obj, callback) {
    console.log('regist_action');
    var body_Obj = {};
    console.log(resource_Obj);

    if (ty == '1') {
        console.log('acp regist/update');

        db_sql.insert_acp(resource_Obj, function (err, results) {
                if (!err) {
                    callback('1', resource_Obj);
                }
                else {
                    if (results.code == 'ER_DUP_ENTRY') {
                        body_Obj = {};
                        body_Obj['dbg'] = "resource (" + resource_Obj[rootnm].rn + ") is already exist";
                        responder.response_result(request, response, 409, body_Obj, 4105, request.url, body_Obj['dbg']);
                    }
                    else {
                        body_Obj = {};
                        body_Obj['dbg'] = '[regist_action] ' + results.message;
                        responder.response_result(request, response, 500, body_Obj, 5000, request.url, body_Obj['dbg']);
                    }
                    callback('0', resource_Obj);
                    return '0';
                }
            });
    }
    else if (ty == '2') {
        console.log('ae regist');

        db_sql.insert_ae(resource_Obj, function (err, results) {
                if (!err) {
                    callback('1', resource_Obj);
                }
                else {
                    if (results.code == 'ER_DUP_ENTRY') {
                        body_Obj = {};
//                        body_Obj['dbg'] = "resource (" + resource_Obj.rn + ") is already exist";
                        body_Obj['dbg'] = "Exception Error.";
//                        responder.error_result(request, response, 409, 4105, body_Obj['dbg']);
                        responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
                    }
                    else {
                        body_Obj = {};
                        body_Obj['dbg'] = '[regist_action] ' + results.message;
                        responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
                    }
                    callback('0', resource_Obj);
                    return '0';
                }
            });
    }
    else if (ty == '3') {
        console.log('container regist');

        db_sql.insert_cnt(resource_Obj, function (err, results) {
            if (!err) {
                callback('1', resource_Obj);
            }
            else {
                if (results.code == 'ER_DUP_ENTRY') {
                    body_Obj = {};
                    body_Obj['dbg'] = "resource (" + resource_Obj[rootnm].rn + ") is already exist";
//                    responder.error_result(request, response, 409, 4105, body_Obj['dbg']);
                    responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
                }
                else {
                    body_Obj = {};
                    body_Obj['dbg'] = '[regist_action] ' + results.message;
                    responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
                }
                callback('0', resource_Obj);
                return '0';
            }
        });
    }
//  CSEBaseも登録できるようにする
    else if (ty == '5') {
        console.log('CSE regist');

        db_sql.insert_cb(resource_Obj, function (err, results) {
            if (!err) {
                callback('1', resource_Obj);
            }
            else {
                if (results.code == 'ER_DUP_ENTRY') {
                    body_Obj = {};
                    body_Obj['dbg'] = "resource (" + resource_Obj[rootnm].rn + ") is already exist";
                    responder.error_result(request, response, 409, 4105, body_Obj['dbg']);
                }
                else {
                    body_Obj = {};
                    body_Obj['dbg'] = '[regist_action] ' + results.message;
                    responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
                }
                callback('0', resource_Obj);
                return '0';
            }
        });
    }
    else {
        body_Obj = {};
        body_Obj['dbg'] = "ty is not supported";
        responder.error_result(request, response, 400, 4000, body_Obj['dbg']);
        callback('0', resource_Obj);
        return '0';
    }
}

exports.regist = function (request, response, callback) {
	console.log('create');
        regist_action(request, response, request.ty, request.bodyObj, function (rsc, create_Obj) {
            if (rsc == '1') {
                _this.remove_no_value(request, create_Obj);
                var status_code = 200;
                var rsc_code = 2000;
                    responder.response_result(request, response, status_code, request.body, rsc_code, '');
                    callback(rsc);
                    return '0';
            }
        });
//    });
};

function retrieve_action(request, response, callback) {
	console.log('retrieve_action');    // 引数のuriをキーに、lookupテーブルで一致するレコードを探す
	db_sql.select_lookup(request.url,function (err, search_Obj) {
        	if (!err) {
	   		rows=JSON.parse(JSON.stringify(search_Obj[0]));
			console.log(rows.ty);
                        ty = rows.ty;

/*                 ACPはlookupテーブルは探さない
           		if (ty == '1') {
                		console.log('search acp table');
                                // ACP tableをsearchする
				db_sql.select_acp(request.url,function (rsc, result_ae) {
                   			if(!rsc){
					}
				});
           		} else 
*/
                        if (ty== '2') {
				console.log('search ae table');
                                // AE table をsearchする
                		db_sql.select_ae(request.url,function (rsc, result) {
                   			if(!rsc){
                      				rec_data=JSON.parse(JSON.stringify(result[0]));
						console.log(rec_data);
						var newHashmap = {};
						Object.keys(rec_data).forEach(function(key){
    							var value = rec_data[key];
							if(key == 'url'){
								newHashmap[key]  = value;
				        			newHashmap['ty'] = ty;
							}else if (key == 'rn'){

							}else if (key == 'aei'){
				        			newHashmap['sri'] = value;
							}else{
				        			newHashmap[key] = value;
    							}
						});
						console.log(newHashmap);
						callback('1', JSON.stringify(newHashmap));
                   			}else{
						callback('0',"resource not found in the ae table"); // mysql自体の問題のケースもあり
		   			}
                		});
	   		} else if (ty == '3') {
				console.log("search cotainer table");
                                // container tableをsearchする
				db_sql.select_cnt(request.url,function (rsc, result) {
                   			if(!rsc){
                      				rec_data = JSON.parse(JSON.stringify(result[0]));
						console.log(rec_data);
						var newHashmap = {};
						// 以下、リソース取得を完成させる
						Object.keys(rec_data).forEach(function(key){
    							var value = rec_data[key];
							if(key == 'url'){
								newHashmap[key]  = value;
				        			newHashmap['ty'] = ty;
							}else if (key == 'rn'||key == 'pae'){

							}else if (key == 'cnti'){
				        			newHashmap['sri'] = value;
							}else{
				        			newHashmap[key] = value;
    							}
						});
						console.log(newHashmap);
						callback('1', JSON.stringify(newHashmap));
                   			}else{
						callback('0',"resource not found in the cnt table"); // mysql自体の問題のケースもあり
		   			}
                                });
	   		}else if (ty == '5') {
				console.log("search CSEBase table");
                                // container tableをsearchする
				db_sql.select_cnt(request.url,function (rsc, result) {
                   			if(!rsc){
                      				rec_data=JSON.parse(JSON.stringify(result[0]));
						var newHashmap = {};
						Object.keys(rec_data).forEach(function(key){
    							var value = rec_data[key];
							console.log(key);
							if(key == 'url'){
								newHashmap[key]  = value;
				        			newHashmap['ty'] = ty;
							}else if (key == 'rn'){

							}else if (key == 'csi'){
				        			newHashmap['sri'] = value;
							}
						});
						console.log("after:");
						console.log(newHashmap);
//						create_Obj=newHashmap;
						callback('1', JSON.stringify(newHashmap));
                   			}else{
						callback('0',"resource not found in the cse table"); // mysql自体の問題のケースもあり
		   			}
                                });
	   		}
		}else{
            		callback('0', "resouce not found in the lookup table");
        	}
        });
};

exports.retrieve = function (request, response) {
	console.log('retrieve');

            retrieve_action(request, response, function (rsc, search_Obj) {
                if (rsc == '0') {
                    return rsc;
                }
                console.log('retrieve returning');
		console.log(search_Obj);
		responder.response_result(request, response, 200, search_Obj, 2000, ''); 
//                    callback(rsc, search_Obj);
//                    return '0';
            });
};

/*  DAS的な更新は、以下のコメントで完了では？tyの判定は、db_sql側で実施する
　　db_sql.update_resource(ty,resource_Obj[rootnm], function (err, results) {
    // Updateの結果は、全てのtyで共通なので、まとまめる。
    if (!err) {
        callback('1', resource_Obj);
    }
    else {
        body_Obj = {};
        body_Obj['dbg'] = results.message;
        responder.response_result(request, response, 500, body_Obj, 5000, request.url, body_Obj['dbg']);
        callback('0', resource_Obj);
        return '0';
        }
    });

*/

// リソースのUpdateが完了したら、lookupテーブルの当該エントリーの更新日時を書き換える
function update_action(request, response, ty, callback) {
    var body_Obj = {};
    console.log('update_action');
    db_sql.select_lookup(request.url,function (err, search_Obj) {
        if (!err) {
		console.log(search_Obj);
		rows=JSON.parse(JSON.stringify(search_Obj));
        	console.log("ty = " + rows[0].ty);
        	ty=rows[0].ty;
/*  		// ACPに関しては、別関数で実装する
    		if (ty == '1') {
        		db_sql.update_acp(resource_Obj, function (err, results) {
                		if (!err) {
                    			callback('1', resource_Obj);
                		}else {
			                body_Obj = {};
            				body_Obj['dbg'] = results.message;
                    			responder.response_result(request, response, 500, body_Obj, 5000, request.url, body_Obj['dbg']);
                    			callback('0', resource_Obj);
                    			return '0';
                		}
            		});
    		} else 
*/
                update_Obj = request.bodyObj;
		update_Obj.url = request.url;
		console.log(update_Obj);

                if (ty == '2') {
			console.log('update ae');
        		db_sql.update_ae(update_Obj, function (err, result) {
                		if (!err) {
                                        // 最新の情報をGetして、返す
                    			callback('1', result);
                		} else {
			                body_Obj = {};
                    			body_Obj['dbg'] = result.message;
                    			responder.response_result(request, response, 500, body_Obj, 5000, request.url, body_Obj['dbg']);
                    			callback('0', resource_Obj);
                    			return '0';
                		}
            		});
    		} else if (ty == '3') {
			console.log('update container');
                        db_sql.update_cnt(update_Obj, function (err, result) {
                		if (!err) {
                                // 最新の情報をGetして、返す
                    			callback('1', resource_Obj);
                		} else {
		                	body_Obj = {};
                   			body_Obj['dbg'] = result.message;
                    			responder.response_result(request, response, 500, body_Obj, 5000, request.url, body_Obj['dbg']);
                    			callback('0', resource_Obj);
                    			return '0';
                		}
        		});
/*
    		} else if (ty == '5') {  // CSEBase
			console.log('update CSEBase');
                        db_sql.update_cse(update_Obj, function (err, result) {
                		if (!err) {
                                        // 最新の情報をGetして、返す
                    			callback('1', resource_Obj);
                		} else {
		    			body_Obj = {};
                    			body_Obj['dbg'] = result.message;
                    			responder.response_result(request, response, 500, body_Obj, 5000, request.url, body_Obj['dbg']);
                    			callback('0', resource_Obj);
                    			return '0';
                		}
            		});
*/
    		} else {
        		body_Obj = {};
        		body_Obj['dbg'] = "ty does not supported";
        		responder.response_result(request, response, 400, body_Obj, 4000, request.url, body_Obj['dbg']);
        		callback('0', resource_Obj);
        		return '0';
    		}
	}
    });
}

// Updateは受信したデータを使って、そのままデータを更新する。
exports.update = function (request, response) {

        update_action(request, response, request.ty, function (rsc, update_Obj) {
            if (rsc == '1') {
                _this.remove_no_value(request, update_Obj);
                responder.response_result(request, response, 200, update_Obj, 2004, request.url, '');
                return '0';
            }
        });
//    });
};

// AEは以下のようなデータを、API上削除時に返信するデータとして作成する必要がある
/*
AE
{
  "url": "//kddi.jp/cse-id/cse-base/sensor_ae",	<- lookupから
  "ty": 2,					<- lookupから
  "sri": "S20180417070045277BCV0",		<- lookupから
  "class":0,					<- 以下は、ae/cnt/cseなどから
  "usr":"USR0001",
  "name":"センサー",
  "datatypes":["DATA001","DATA002"],
  "type":125,
  "policy":[
    {
      "data_id" : "DATA0001",
      "required_flag" : true,
      "purpose" : "PURPOSE01"
     },{
      "data_id": "DATA0003",
      "required_flag" : false,
      "purpose" : "PURPOSE03"
     }
   ]
}

CNT
{
  "url": "//kddi.jp/cse-id/cse-base/sensor_ae/tempareture",	<- lookupから
  "ty": 3,					<- lookupから
  "sri": "S20180417070045277BCV0",		<- lookupから
  "datatypes":["DATA001","DATA002"],
}

CBS
{
  "url": "//kddi.jp/cse-id/cse-base",
  "ty": 5,					<- lookupから
  "sri": "cse-id"
}
*/
table_name_list = {1:"acp",2:"ae",3:"cnt",4:"cnti",5:"cse"};

function delete_action(request, response, callback) {
    console.log('delete action');

    // まず、lookup/ae(cnt)テーブルから、urlに対応するtyを取得する
    db_sql.select_lookup(request.url,function (err, search_Obj) {
      console.log(err);
      console.log(search_Obj);
      console.log(search_Obj.length);

      if (search_Obj.length && err) {
        console.log(search_Obj);
    // uriが存在したら、そのレコードのtyの値から検索先のテーブルを決定する
	rows=JSON.parse(JSON.stringify(search_Obj[0]));
        ty=rows.ty;

        var create_Obj={};
	db_sql.select_rec(request.url,table_name_list[ty], function (rsc, result_Obj) {
            if(!rsc){
                // resource毎に応答時に送信するデータを作成する(他のリソース関連のAPIでも、一覧表示以外は共通）
            	hashmap=JSON.parse(JSON.stringify(result_Obj[0]));
	    	var newHashmap = {};

                if( ty == '2' ) {
		    console.log("get ae info");
    	            Object.keys(hashmap).forEach(function(key){
    	    		var value = hashmap[key];
			console.log(key);
			if(key == 'url'){
				newHashmap[key] = value;
                                // urlのデータの次に、tyを追加
				newHashmap['ty'] = ty;
			}else if (key == 'rn'){

	    		}else if (key == 'aei'){
				newHashmap['sri']= value;
	    		}else{
				newHashmap[key] = value;
    	    		}
		    });
                }
                else if (ty== '3') {
		    console.log("get container info");
    	            Object.keys(hashmap).forEach(function(key){
    	    		var value = hashmap[key];
			console.log(key);
			if(key == 'url'){
				newHashmap[key] = value;
				newHashmap['ty'] = ty;
			}else if (key == 'pae' || key == 'rn'){

	    		}else if (key == 'cnti'){
				newHashmap['sri']= value;
	    		}else{
				newHashmap[key] = value;
    	    		}
		    });

		}
		else if (ty== '5') {
		    console.log("get cse info");
    	            Object.keys(hashmap).forEach(function(key){
    	    		var value = hashmap[key];
			console.log(key);
			if(key == 'url'){
				newHashmap[key] = value;
				newHashmap['ty'] = ty;
	    		}else if (key == 'csi'){
				newHashmap['sri']= value;
	    		}
		    });

		}
		create_Obj=JSON.stringify(newHashmap);
        	console.log(create_Obj);
	    }
            else {
		/*  resoureテーブルに存在しない場合、エラーを返す */
		var body_Obj = {};
                body_Obj['dbg'] = search_Obj.message;
                responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
	    }
         });

	// Responseを作成したら、lookupテーブルから削除(rceはlookupとカスケードの関係になっているので、lookupテーブルから削除するとrecテーブルからも自動的に削除される）
	db_sql.delete_lookup(request.url, function (err, search_Obj) {
        	if (!err) {  // lookupテーブルから削除OK（自動的にリソーステーブルからも削除されるはず）
	        	callback('1', create_Obj);
                        return '0';
		}
/*
                        // リソースの削除
                        db_sql.delete_rce(request.url, table_name_list[ty], function (err, search_Obj) {
                            if(!err){
	        		callback('1', create_Obj);
                                return '0';
			    }else { // リソースの削除でエラー
　　　　			var body_Obj = {};
        　　　　        	body_Obj['dbg'] = search_Obj.message;
                　　　　	responder.response_result(request, response, 500, body_Obj, 5000, request.url, body_Obj['dbg']);
               　　　　 	callback('0', body_Obj);
              　　　　  	return '0';
                            }
			});
*/
		else { // delete lookupでエラーが返った場合
			var body_Obj = {};
                	body_Obj['dbg'] = search_Obj.message;
                	responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
                	callback('0', body_Obj);
                	return '0';
        	}
	});
      }
      else
      {
	var body_Obj = {};
//        body_Obj['dbg'] = search_Obj.message;
//        body_Obj['dbg'] = 'resource does not exit';
        body_Obj['dbg'] = 'Exception Error.';
        responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
        callback('0', body_Obj);
        return '0';
      }
    });
}

exports.delete = function (request, response) {

        delete_action(request, response, function (rsc, delete_Obj) {
            if (rsc == '1') {
                _this.remove_no_value(request, delete_Obj);
                responder.response_result(request, response, 200, delete_Obj, 2002, '');
                return '0';
            }
        });
//    });
};

