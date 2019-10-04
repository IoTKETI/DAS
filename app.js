/**
 * Copyright (c) 2019, KDDI Research, Inc.
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


//process.env.NODE_ENV = 'production';
process.env.NODE_ENV = 'development';

var fs = require('fs');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var util = require('util');
var url = require('url');
var ip = require('ip');
var crypto = require('crypto');
var fileStreamRotator = require('file-stream-rotator');
var merge = require('merge');
var https = require('https');
var moment = require('moment');
var responder = require('./das/responder');
var resource = require('./das/resource');
var db = require('./das/db_action');
var db_sql = require('./das/sql_action');
var app = express();

var logDirectory = __dirname + '/log';

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// create a rotating write stream
var accessLogStream = fileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    filename: logDirectory + '/access-%DATE%.log',
    frequency: 'daily',
    verbose: false
});

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}));
//ts_app.use(morgan('short', {stream: accessLogStream}));

var cluster = require('cluster');
var os = require('os');
var cpuCount = os.cpus().length;
var worker = [];
var use_clustering = 1;
var worker_init_count = 0;

console.log('Start DAS server!');

    db.connect(usedbhost, 3306, 'root', usedbpass, function (rsc) {
        if (rsc == '1') {
                if(use_secure === 'disable') {
                    http.createServer(app).listen({port: usedasbaseport, agent: false}, function () {
                        console.log('das server (http) (' + ip.address() + ') running at ' + usedasbaseport + ' port');
                    });
                }
                else {
                    var options = {
                        key: fs.readFileSync('server-key.pem'),
                        cert: fs.readFileSync('server-crt.pem'),
                        ca: fs.readFileSync('ca-crt.pem')
                    };
                    https.createServer(options, app).listen({port: usedasbaseport, agent: false}, function () {
                        console.log('das server (https) (' + ip.address() + ') running at ' + usedasbaseport + ' port');
                    });
                }
        }
    });

// request.body�̓��e����͂��āA�e�o�C���f�B���O�v���g�R����JSON�`���ɕϊ��������ʂ��Arequest.body�ɏ㏑��
function parse_to_json(request, response, callback) {
    var body_Obj = {};

    try {
        console.log(request.body.toString());
        body_Obj = JSON.parse(request.body.toString());

        console.log(Object.keys(body_Obj));
//      make_short_nametype(body_Obj);
        if (Object.keys(body_Obj)[0] == 'undefined') {
            responder.error_result(request, response, 400, 4000, '[parse_to_json] root tag of body is not matched');
            callback('0', body_Obj);
        }
        request.headers.rootnm = Object.keys(body_Obj)[0];
		console.log('rootnm=');
	        console.log(request.headers.rootnm);
        request.bodyObj = body_Obj;
        callback('1', body_Obj);
    }
    catch (e) {
        responder.error_result(request, response, 400, 4000, '[parse_to_json] do not parse json body');
        callback('0', body_Obj);
    }
}

function parse_body_format(request, response, callback) {
    parse_to_json(request, response, function(rsc, body_Obj) {
        if(rsc == '0') {
            callback('0', body_Obj);
        }
        else {
console.log('parse_to_json OK');
//console.log(Object.getOwnPropertyNames(body_Obj));
     console.log(body_Obj);
     console.log(request.body.toString());
//     body_Obj=request.body.toString();
//            request.headers.rootnm = Object.keys(body_Obj)[0];
            request.headers.rootnm = Object.keys(request.body)[0];
console.log('rootnm=',request.headers.rootnm);

            for (var prop in body_Obj) {
console.log(prop);
//                if (body_Obj.hasOwnProperty(prop)) {
//                    for (var attr in body_Obj[prop]) {
                        // Object��attribute��JSON�`���ɂȂ��Ă��邱�Ƃ��`�F�b�N����
//                        if (body_Obj[prop].hasOwnProperty(attr)) {
console.log('attr=',body_Obj[prop]);
			attr=body_Obj[prop];
/*
                            if (attr == 'aa' || attr == 'at' || attr == 'poa' || attr == 'acpi' || attr == 'srt' ||
                                attr == 'nu' || attr == 'mid' || attr == 'macp' || attr == 'rels' || attr == 'rqps' || attr == 'srv') {
                                if (!Array.isArray(body_Obj[prop][attr])) {
                                    body_Obj = {};
                                    body_Obj['dbg'] = attr + ' attribute should be json array format';
                                    responder.response_result(request, response, 400, body_Obj, 4000, request.url, body_Obj['dbg']);
                                    callback('0', body_Obj);
                                    return '0';
                                }
                            }
*/
                            if (prop == 'url'){
                               console.log('url=',attr);
                               request.url = attr;
                            }
                            else if (prop == 'ty'){
                               console.log('ty=',attr);
                               request.ty = attr;
                            }
                            else if (attr == 'lbl') {
                                if (body_Obj[prop][attr] == null) {
                                    body_Obj[prop][attr] = [];
                                }
                                else if (!Array.isArray(body_Obj[prop][attr])) {
                                    body_Obj = {};
                                    body_Obj['dbg'] = attr + ' attribute should be json array format';
                                    responder.response_result(request, response, 400, body_Obj, 4000, request.url, body_Obj['dbg']);
                                    callback('0', body_Obj);
                                    return '0';
                                }
                            }
                            else if (attr == 'enc') {
                                if (body_Obj[prop][attr].net) {
                                    if (!Array.isArray(body_Obj[prop][attr].net)) {
                                        body_Obj = {};
                                        body_Obj['dbg'] = attr + '.net attribute should be json array format';
                                        responder.response_result(request, response, 400, body_Obj, 4000, request.url, body_Obj['dbg']);
                                        callback('0', body_Obj);
                                        return '0';
                                    }
                                }
                                else {
                                    body_Obj = {};
                                    body_Obj['dbg'] = attr + 'attribute should have net key as child in json format';
                                    responder.response_result(request, response, 400, body_Obj, 4000, request.url, body_Obj['dbg']);
                                    callback('0', body_Obj);
                                    return '0';
                                }
                            }
                            else if (attr == 'pv' || attr == 'pvs') {
                                if (body_Obj[prop][attr].hasOwnProperty('acr')) {
                                    if (!Array.isArray(body_Obj[prop][attr].acr)) {
                                        body_Obj = {};
                                        body_Obj['dbg'] = attr + '.acr should be json array format';
                                        responder.response_result(request, response, 400, body_Obj, 4000, request.url, body_Obj['dbg']);
                                        callback('0', body_Obj);
                                        return '0';
                                    }

                                    var acr = body_Obj[prop][attr].acr;
                                    for (var acr_idx in acr) {
                                        if (acr.hasOwnProperty(acr_idx)) {
                                            if (acr[acr_idx].acor) {
                                                if (!Array.isArray(acr[acr_idx].acor)) {
                                                    body_Obj = {};
                                                    body_Obj['dbg'] = attr + '.acr[' + acr_idx + '].acor should be json array format';
                                                    responder.response_result(request, response, 400, body_Obj, 4000, request.url, body_Obj['dbg']);
                                                    callback('0', body_Obj);
                                                    return '0';
                                                }
                                            }

                                            if (acr[acr_idx].acco) {
                                                if (!Array.isArray(acr[acr_idx].acco)) {
                                                    body_Obj = {};
                                                    body_Obj['dbg'] = attr + '.acr[' + acr_idx + '].acco should be json array format';
                                                    responder.response_result(request, response, 400, body_Obj, 4000, request.url, body_Obj['dbg']);
                                                    callback('0', body_Obj);
                                                    return '0';
                                                }
                                                for (var acco_idx in acr[acr_idx].acco) {
                                                    if (acr[acr_idx].acco.hasOwnProperty(acco_idx)) {
                                                        var acco = acr[acr_idx].acco[acco_idx];
                                                        if (acco.acip) {
                                                            if (acco.acip['ipv4']) {
                                                                if (!Array.isArray(acco.acip['ipv4'])) {
                                                                    body_Obj = {};
                                                                    body_Obj['dbg'] = attr + '.acr[' + acr_idx + '].acco.acip.ipv4 should be json array format';
                                                                    responder.response_result(request, response, 400, body_Obj, 4000, request.url, body_Obj['dbg']);
                                                                    callback('0', body_Obj);
                                                                    return '0';
                                                                }
                                                            }
                                                            else if (acco.acip['ipv6']) {
                                                                if (!Array.isArray(acco.acip['ipv6'])) {
                                                                    body_Obj = {};
                                                                    body_Obj['dbg'] = attr + '.acr[' + acr_idx + '].acco.acip.ipv6 should be json array format';
                                                                    responder.response_result(request, response, 400, body_Obj, 4000, request.url, body_Obj['dbg']);
                                                                    callback('0', body_Obj);
                                                                    return '0';
                                                                }
                                                            }
                                                        }

                                                        if (acco.actw) {
                                                            if (!Array.isArray(acco.actw)) {
                                                                body_Obj = {};
                                                                body_Obj['dbg'] = attr + '.acr[' + acr_idx + '].acco[' + acco_idx + '].actw should be json array format';
                                                                responder.response_result(request, response, 400, body_Obj, 4000, request.url, body_Obj['dbg']);
                                                                callback('0', body_Obj);
                                                                return '0';
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
				console.log('Unknown attr');
                            }
//                        }
//                    }
//                }
            }

            callback(request.ty, body_Obj);
        }
    });
}

// CORS�Ή�
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, X-M2M-RI, X-M2M-RVI, X-M2M-RSC, Accept, X-M2M-Origin, Locale');
    res.header('Access-Control-Expose-Headers', 'Origin, X-Requested-With, Content-Type, X-M2M-RI, X-M2M-RVI, X-M2M-RSC, Accept, X-M2M-Origin, Locale');
    (req.method == 'OPTIONS') ? res.sendStatus(200) : next();
});

app.use(function (request, response, next) {
    // Check X-M2M-RI Header
    if ((request.headers['x-m2m-ri'] == null || request.headers['x-m2m-ri'] == '')) {
        responder.error_result(request, response, 400, 4000, 'BAD REQUEST: X-M2M-RI is Mandatory');
        return '0';
    }
    request.headers.usebodytype = 'json';
    request.url = request.url.replace('%23', '#'); // convert '%23' to '#' of url
    request.hash = url.parse(request.url).hash;

    var absolute_url = request.url.replace('\/_\/', '\/\/').split('#')[0];
    absolute_url = absolute_url.replace(usespid, '/~');
    absolute_url = absolute_url.replace(/\/~\/[^\/]+\/?/, '/');
    var absolute_url_arr = absolute_url.split('/');

    console.log(absolute_url_arr);
    console.log('\n' + request.method + ' : ' + request.url);
    request.bodyObj = {};

    next();
});

// POST
// (1) /das/dynamicacpinfo
// �\�[�X��PPM���Q�Ƃ���
app.post('/das/dynamicacpinfo', function (request, response) {
    console.log('app.post dynamicacpinfo\n',request.params);
// --------------- ���L�̕����͋��ʉ��\ --------------------------
    // body���̃p�����[�^���擾
    var fullBody = '';
    request.on('data', function (chunk) {
        fullBody += chunk.toString();
    });
    console.log(fullBody);
    request.on('end', function () {
        // body���̃`�F�b�N�́Aparse_body_format�ł���Ă��܂��΁A���ʉ��\�B
        request.body = fullBody;
        // Body����NULL
        if (request.body == "") 
        {
//            responder.error_result(request, response, 400, 4000, 'body is empty');
            responder.error_result(request, response, 500, 5000, 'body is empty');
            return '0';
        }
        // body���̃f�[�^�̌`�������������Ƃ��`�F�b�N
        parse_body_format(request, response, function (rsc, body_Obj) {
            if (rsc != '0') 
            {
// --------------- ��L�̕����͋��ʉ��\ --------------------------

// --------------- �ȉ��͎�M�f�[�^�̐������̃`�F�b�N�i�ʊ֐��ɕ�������H�j ------------------
		body_data = body_Obj['m2m:rqp'];
                error="";

                mandatory_keys = ['op', 'to', 'fr' ,'rqi' ,'pc'];
                var keys = Object.keys(body_data);

                if( mandatory_keys.sort().toString() != keys.sort().toString())
                {
		    error = "NG:Mandatory parameters NOT matched!";      // RSC(response status code��ݒ肷��Berror = 
                    responder.error_result(request, response, 500, 5000, error);
                }

                response_info = {};
		trt = 0;

    		for (key in body_data) 
                {
        	    if(key == 'op' && body_data[key] != 5)
        	    {
	    		error = "NG:operation of the request is not NOTIFY.";
                        responder.error_result(request, response, 500, 5000, error);
        	    }

                    if((key == 'to' || key == 'fr' || key == 'rqi') && !body_data[key])
                    {
	    		error = "NG:Parameter " + key + " of the request is empty.";
                        responder.error_result(request, response, 500, 5000, error);
                    } else {
                    	if(key == 'rqi'){
			    response_info[key] = body_data[key];
                            console.log(response_info);
			}
                    }

                    if(key == 'pc')
                    {
                        pc_data = body_data[key];

                        if(!pc_data)
                        {
			    error = "NG:Parameter " + key + " of the request is empty.";
                            console.log(error);
                            responder.error_result(request, response, 500, 5000, error);
                        }
                            seci_data = pc_data['seci'];
                            console.log(seci_data);

                            seci_mandatory_keys = ['sit', 'dreq'];
                            console.log(seci_mandatory_keys.sort().toString());

	                    var seci_keys = Object.keys(seci_data);
                            console.log(seci_keys.sort().toString());

	                    if( seci_mandatory_keys.sort().toString() != seci_keys.sort().toString())
                            {
	            		console.log('NG:Mandatory security parameters NOT matched!');
                    		responder.error_result(request, response, 500, 5000, 'NG:mandatory security parameters NOT matched!');
                	    }

                            for(seci_key in seci_data )
			    {
	                        if(seci_key == 'sit' && seci_data[seci_key] != 1)
                                {					
                    		    responder.error_result(request, response, 500, 5000, 'NG:Parameter [sit] in [seci] is not 1(Dynamic Authorization Request).');
                                    return;
				}

                                if(seci_key == 'dreq')
                                {
                                    dreq_data = seci_data[seci_key];
 	                       	    dreq_mandatory_keys = ['or', 'trt', 'op', 'trid'];
		                    var dreq_data_keys = Object.keys(dreq_data);

                                    for (var dreq_mandatory_key of dreq_mandatory_keys)
                                    {
//                                        console.log(dreq_mandatory_key); // �K�{�̃L�[���S��dreq�f�[�^�Ɋ܂܂�Ă��邩�H
		        	        if(!dreq_data_keys.includes(dreq_mandatory_key))
		                        {
	            			    console.log('Mandatory dreq parameter is missing!');
                    			    responder.error_result(request, response, 500, 5000, 'mandatory security parameters NOT matched!');
                	    	        }
                                    }
                                    // dreq�p�����[�^�̏���
                                    for( dreq_key in dreq_data ) 
                                    {
                                        console.log(dreq_key + ':'+dreq_data[dreq_key] );
					if(dreq_key == 'or')
                                        {
					    if( !dreq_data[dreq_key])
					    {
						responder.error_result(request, response, 500, 5000, 'Parameter [or] in [dreq] is empty.');
					    }
                                            else
					    {
						response_info[dreq_key]=dreq_data[dreq_key];
                                                console.log(response_info);
					    }
					}
					if(dreq_key == 'trt')
					{
						if (dreq_data[dreq_key] != 2 && dreq_data[dreq_key] != 3 && dreq_data[dreq_key] != 4)  // ae,cnt,cin�̂�
                                        	{
					    	    responder.error_result(request, response, 500, 5000, 'Parameter ' + dreq_key + ' of the request is not supported.');
                                        	}
                                        	else
						{
					    	    response_info[dreq_key]=dreq_data[dreq_key];
                                            	    console.log(response_info);
						}
					}
                                        if(dreq_key == 'op' && dreq_data[dreq_key] != 2)
					{
					    responder.error_result(request, response, 500, 5000, 'Parameter ' + dreq_key + ' of the request is not supported.');
					}
					// �I���W�i����PPM�ł́Atrid (option)�����݂��Ȃ��ƃG���[�B����́A��񂪖�����ACP������ł��Ȃ�����B
                                        if(dreq_key == 'trid')
					{
					    if( !dreq_data[dreq_key])
					    {
						responder.error_result(request, response, 500, 5000, 'Parameter [trid] in [dreq] is empty.');
					    }
                                            else
					    {
						response_info[dreq_key]=dreq_data[dreq_key];
                                                console.log(response_info);
					    }
					}
					if(dreq_key == 'ppl')
					{
					    if( !dreq_data[dreq_key])
					    {
						response_info[dreq_key]=0;
                                                console.log(response_info);
					    }
					    else
					    {
						response_info[dreq_key]=dreq_data[dreq_key];
                                                console.log(response_info);
					    }
					}
					// rfa(role-id list),tids(token-id list)�̓t�F�[�Y2�ŁA asi(authorSignIndicator)�͖���B
                                    }
                                }
                            }
                    }
    		}
		//
                // dynamicACPInfo(dai)�Aphase2�ł�tokens��Response�Ƃ��ĕԐM
		// DAS�̎d�l�ł́Atokens and/or dai��ԐM����
		//
		console.log('Send back dynamicACPInfo');
                // header (X-M2M-RI��ANotify�ŕԐM����K�v������BPOST�j

		// trt == 4 (contentInstance�̏ꍇ�́Acontainer��trid���擾���āAcontainer��ACP��ԐM����j
		if (response_info['trt'] == 4) 
		{
                    data_len = response_info['trid'].length;
		    console.log(data_len);
		    splitted_path = response_info['trid'].split('/');
                    console.log(splitted_path);
                    console.log(splitted_path.length);
		    console.log(splitted_path[0]);
		    console.log(splitted_path[1]);
		    console.log(splitted_path[2]);
		    console.log(splitted_path[3]);
		    console.log(splitted_path[4]);
		    console.log(splitted_path[5]);
		    path_depth = splitted_path.length;

		    console.log(splitted_path[path_depth-1]);
                    console.log(splitted_path[path_depth-1].length);
                    trid_info = response_info['trid'].substr(0,data_len-(splitted_path[path_depth-1].length + 1));  // �Ō��1��'/'��
		}
		else
		{
		    trid_info = response_info['trid'];
		}
		console.log(trid_info);

//		db_sql.select_acp(response_info['trid'],response_info['or'],function(err,result){
		db_sql.select_acp(trid_info,response_info['or'],function(err,result){
                    console.log(err);
                    console.log(result);

//		    if(err && result != []){  // sql�̃G���[�͂Ȃ����A���ʂ�null�̃P�[�X����Bresult�͋󃊃X�g�B
		    if(result != []){  // sql�̃G���[�͂Ȃ����A���ʂ�null�̃P�[�X����Bresult�͋󃊃X�g�B
			// return ACP info. result�ɂ�acp�̌������ʂ������Ă���
			result_object = JSON.parse(JSON.stringify(result[0]));
                        policy_data = JSON.parse(result_object['policy']);
                        //                        policy_data�ɂ́A"acor"(originator)�̏�񂪓����Ă��Ȃ��̂ŁA�擪�ɒǉ�����j2019/9/27
                        // �擪�ɓ��ꂽ��
                        var work = {};
			work['acor'] = [response_info['or']];
                        policy_data=Object.assign(work,policy_data);
                        console.log(policy_data);
			// pl�����݂��Ȃ��ꍇ�́Appl����M�f�[�^�ɂ���΂����ݒ肷��B
			// pl���Appl�����݂��Ȃ��ꍇ�́Adefault�l 3600�b�Ƃ���B
			console.log(typeof(policy_data));
			if('pl' in policy_data){
			    ppl_val = policy_data['pl'];
                            delete policy_data['pl'];
			}
			else if ('ppl' in response_info){
			    ppl_val = response_info['ppl'];
			}
			else {
			    ppl_val = 3600; // default
			}
                        console.log(ppl_val);
			response_hash = {};
			response_hash['rsc'] = 2000;
			response_hash['rqi'] = response_info['rqi'];
			// content (pc)�̍\�z
			dai = {};
                        dai['gp'] = [policy_data];
                        dai['pl'] = ppl_val;
                        console.log(dai);
                        dres ={};
			// token��dai�͗����܂܂��P�[�X�͂���B
			dres['dai'] = dai;
                        seci= {};
                        seci['sit'] = 2;
                        seci['dres'] = dres;
                        console.log(seci);
			pc = {};
                        pc['seci'] = seci;
                        // content (pc)�̕ۑ�
                        response_hash['pc'] = pc;
			console.log(response_hash);
//			dres['tkns'] = [];
                        final_response = {};
			final_response['m2m.rsp'] = response_hash;
			console.log(JSON.stringify(final_response));
			responder.response_result(request, response, 200, JSON.stringify(final_response), 2000, '');
		    }else{
			console.log('no trid and or combination');
			responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
		    }
		});
/*
{
	"m2m:rsp" : {
	    "rsc": 2000,
	    "rqi" : "A1000",
	    "pc" :  {
		"seci": {
		    "sit" : 2,
		    "dres" : {
			    "dai" : �o
				"gp" :
				[
				    {
					"acor" : ["//abc.org/C190AAA",  "//abc.org/C190BBB", "//abc.org/C190CCC"]
					"acop" : 5,
					"acco" : {
					    "actw" : ["* 0-5 2,6,10 * * * *"]
					    "acip" : {
						"ipv4" : []
						"ipv6" : []
					    �p
					    "aclr" : {�c}
					�p
					"acaf": TRUE
				    }
				],
				"pl" : "3600",
			    },
			    "tkns" :
			    [
				"eyJ0eXAiOiJK.eyJpc3MiOiJqb2UiLA0KIC.dBjftJeZ4CVP",
				"eyJ0eXAiOiJK.eyJpc3MiOiJqb2UiLA0KIC.dBjftJeZ4CVP.5eym8TW_c8SuK.SdiwkIr3a.XFBoMYUZo"
			    ]
		    } // dres
		} // seci
	    } // pc
	} // m2m:rsp
}
*/
                
            }
       });
    });
    // dynamicACPInfo�̃p�����[�^�̐��������`�F�b�N(�K�{�p�����[�^�����݂��邱�ƂƁA���̃f�[�^�������������Ă��邱�Ƃ��`�F�b�N�j��dynamicACPInfo�̎d�l���`�F�b�N����
//    request.ty='34'; // dynamicAuthorizationConsultation(�{���ɕK�v���H�j
/*

			if( (null == dreqCheck.getTargetedResourceID())
			 || (true == dreqCheck.getTargetedResourceID().isEmpty()) ){
				ErrMsg = "Parameter [trid] in [dreq] is not provided or empty.";
				break;
			}
			
			String[] or = dreqCheck.getOriginator().split("/");
			int orLength = or.length;
			if( 5 > orLength ) {
				ErrMsg = "Parameter [or] in [dreq] is not provided.";
				break;
			}
			
			int trt = dreqCheck.getTargetedResourceType();
			String[] trid = dreqCheck.getTargetedResourceID().split("/");
			int tridLength = trid.length;
			if(2 == trt) {
				if( 5 > tridLength ) {
					ErrMsg = "Parameter [trid] in [dreq] is not provided";
					break;
				}
			} else if(3 == trt) {
				if( 6 > tridLength ) {
					ErrMsg = "Parameter [trid] in [dreq] is not provided";
					break;
				}
			} else if(4 == trt) {
				if( 7 > tridLength ) {
					ErrMsg = "Parameter [trid] in [dreq] is not provided";
					break;
				}
			}

*/

    // dynamicACPInfo�̃��C������
    
    // dynamicACPInfo�őg�ݗ��Ă������f�[�^��ԐM����

    //�@�֐������������ۂɂ́Anext()�͕s�v
//    next();
});
 
// (2) /das/acp �F���̓o�^/�X�V(�o�^�ς̏ꍇ�͍X�V����j
// �p�����[�^��				�K�{
// �^�[�Q�b�gID				��
// ���N�G�X�g��ID			��
// ���[�UID				
// ACP���				��
// 	���I�y���[�V����		��
// 	�L������			��
//      ACCO
// 		accessControWindow			
// 		accessControlIpAddresses		
// 		accessControlLocationRegion		
// 	accessControlAuthenticationFlag			
// 	�g�[�N��ID���X�g				

function get_body_json_data(request, callback){

    var fullBody = '';
    request.on('data', function (chunk) {
        fullBody += chunk.toString();
    });
    console.log(fullBody);
    request.on('end', function () {
        if (fullBody == "") {
            callback(1,'body is empty');
            return '0';
        }
        body_Obj = JSON.parse(fullBody.toString());
        callback(0,body_Obj);
    });
}

app.post('/das/acp', function(request, response) {
    console.log('app.post acp regist/update\n');
    // acp���o�^�ς݂Ȃ�A�X�V�������s��
    // �o�^�ς݂��ǂ����̔���́H�@usr�̓I�v�V�����Ȃ̂ŁAtrid/or����v���邩�ǂ����Ō���̂��Hpolicy�͕K�{������r�Ώۂł͂Ȃ��B

    get_body_json_data(request, function(err, result) {
        if (!err) {
            body_Obj = result;
            console.log(body_Obj);

            policy_data = body_Obj['policy'];
            if (!body_Obj['trid'] || !body_Obj['or'] || !policy_data) {
                console.log('Mandatory data is missing');
                body_Obj['dbg'] = 'Exception Error.';
                responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
//                return '0';
            } else if (!policy_data['acop'] || !policy_data['pl']) {
                console.log('Mandatory acp data is missing');
                body_Obj['dbg'] = 'Exception Error.';
                responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
//                return '0';
            }

            // regist/update acp info (policy �͂��̂܂�DB�ɕۑ�����j
            db_sql.insert_acp(body_Obj, function(err, results) {
                if (!err) {
                    console.log('acp inserted!');
                    // response�́A�X�V���ꂽACP��Get�������́B
                    db_sql.select_acp(body_Obj['trid'], body_Obj['or'], function(err, result) {
		            responder.response_result(request, response, 200, JSON.stringify(result[0]), 2000, '');
                    });
                } else if (results.code == 'ER_DUP_ENTRY') {
                    console.log('data duplicated! change to update...');
                    db_sql.update_acp(body_Obj, function(err, result) {
                        if (!err) {
                            console.log('acp updated!');
                    	    db_sql.select_acp(body_Obj['trid'], body_Obj['or'], function(err, result) {
		         	responder.response_result(request, response, 200, JSON.stringify(result[0]), 2000, '');
                    	    });
                        }else{
			    console.log('acp update was failed');
			    responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
			}
                    });
                } 
		else 
		{
                    console.log('acp insertion was failed');
	    	    body_Obj['dbg'] = 'Exception Error.';
            	    responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
                }
            });
        }
	else
	{
            console.log('body data is missing');
	    body_Obj['dbg'] = 'Exception Error.';
            responder.error_result(request, response, 500, 5000, body_Obj['dbg']);
	}
    });
});

// (3) ���\�[�X�̓o�^�iCSE, ae, cnt, ACP�j

app.post('/das/rce', function(request, response) {
    console.log('app.post rsc regist\n');
    // -------------------�@Body�f�[�^�̎擾�ƃ`�F�b�N�i���ʉ��\�j ----------------------
    var fullBody = '';
    request.on('data', function(chunk) {
        fullBody += chunk.toString();
    });
    console.log(fullBody);
    request.on('end', function() {
        request.body = fullBody;
        if (request.body == "") {
            responder.error_result(request, response, 400, 4000, 'body is empty');
            return '0';
        }
        parse_body_format(request, response, function(rsc, body_Obj) {
            console.log('parse_body_format Done!', rsc);
            console.log(body_Obj);
            // -------------------�@Body�f�[�^�̎擾�ƃ`�F�b�N ----------------------
            if (rsc != '0') {
                // resource�̏���lookup�e�[�u���ɍ쐬����B�쐬�Ɂ@���s������A�G���[�ŕԂ��B
                // ty����A�ۑ�����e�[�u����I������B
                // ���̃e�[�u���ɑ΂��āA���\�[�X�����쐬����B�쐬�Ɏ��s������Alookup�e�[�u���ō쐬�������\�[�X���폜������ŁA�G���[��Ԃ�
                console.log('headers=', request.headers['x-m2m-origin']);
                request.bodyObj.or = request.headers['x-m2m-origin'];
                var url = request.bodyObj.url;
                console.log('url=', url);

                // url�����('/'�ŕ����j���āAresource name���擾����B 
                var url_data = url.split('/');
                /*
                		console.log('url_data_len=', url_data.length);
                		console.log('url_data1=', url_data[1]);
                		console.log('url_data1=', url_data[2]);
                		console.log('url_data1=', url_data[3]);
                */
                request.bodyObj.rn = url_data[url_data.length - 1];
                console.log('rn=', request.bodyObj.rn);

                // ae�̏ꍇ�́A���ɏ����Ȃ��B
                if (request.ty == 3) { // cnt
                    // get parent id  "kddi.jp/cse-id/cse-base/sensor_ae/humidity"-> pae = "kddi.jp/cse-id/cse-base/sensor_ae"
                    request.bodyObj.pae = url.substr(0, url.length() - (request.bodyObj.rn.lenght() + 1)); // +1�� "/humidity"�̍ŏ���"/"��
                } else if (request.ty == 5) { // cse, ���͈�����cse-id�������Ă���H
                    // get csi "//kddi.jp/cse-id/cse-base" -> "/cse-id"
                    request.bodyObj.csi = "/" + url_data[url_data.length - 2];
                }
                console.log(request.bodyObj);
                resource.regist(request, response, function(rsc) {

                });
            }
        });
    });
});

// GET
// (1) das/rce/_/(���\�[�X��URI)
//  query parameter�F�@�Ȃ�
//
// �i��jGET : /das/rce/_/sensor
// retrieve resource[object Object]
// get_resource_from_url (SyJqH4A0N): 1.785ms
// app.get  { resource_uri: 'sensor' } (request.params��JSON�`���Ŏ擾�����j

// �����T�v�F
// resource_uri���L�[�ɁAlookup�e�[�u������������
// ��v������̂�����ꍇ�́A���̃��R�[�h��ty���擾����
// ty�̎�ނɉ����āAcb/ae/cnt(/acp)�̃e�[�u����I�����Aurl��resource_uri�ƈ�v����������X�|���X�Ƃ��ĕԂ�

app.get('/das/rce/_/:resource_uri', function(request, response) {
    console.log('app.get ', request.params);
    console.log(request.params['resource_uri']);
    request.url = request.params['resource_uri'];
    resource.retrieve(request, response);
});

// (2) /das/rcelist
//
// �S�p�����[�^�̓I�v�V�����I
// ty			���\�[�X�^�C�v		���S��v
// class		AE�̃N���X		���S��v
// usr			���[�U�h�c		���S��v
// name			�\����			���S��v
// datatype		�f�[�^���		������v�iae, cnt)
// type			AE�^�C�v		���S��v
// pae			�eAE			���S��v

// �o��
// {
//   "rces": [
//     {
//        "url": "//kddi.jp/cse-id/cse-base/sensor_ae",
//        "ty": 2,
//        "sri": "S20180417070045277BCV0"
//     },{
//        "url": "//kddi.jp/cse-id/cse-base/sensor_ae/cnt1",
//        "ty": 3,
//        "sri": "cnt001dfrslfa"�@�@<--- ri(ae: ae-id, cse: cse-id, cnt:rn?)�̒l��ݒ肷��H
//     }
//   ]
// }
// ���邢�́Aurl�̈ꗗ��Ԃ����H

app.get('/das/rcelist', function(request, response) {
    console.log(request.query); /// ?ty=2&class=24 �Ȃ�A{ ty: '2', class: '24' }�ƂȂ�A�L�[���w�肵�ėv�f���擾�\
    var Object = request.query;
    db_sql.select_reclist(request, function(err, result) {});
});

// (3) /das/acp
// trid, or�͕K�{�A���S��v��acp�e�[�u�����猟��
app.get('/das/acp', function(request, response) {
    console.log('app.get ', request.query);
    // �p�����[�^�`�F�b�N
    keys = Object.keys(request.query);
    if (!keys || keys.length != 2 || !request.query['trid'] || !request.query['or']) {
        // parameter error
        //	    responder.error_result(request, response, 500, 5000, 'parameter error');
        responder.error_result(request, response, 500, 5000, 'Exception Error.');
    }
    // �p�����[�^�`�F�b�NOK�Ȃ̂ŁAACP�擾����
    db_sql.select_acp(request.query['trid'], request.query['or'], function(err, result) {
        // trid/or�Ŏw�肷��f�[�^�����݂��Ȃ��ꍇ�Aerr=null, result=[]��sql���x���ŕԂ�
        if (!err) {
            responder.response_result(request, response, 200, JSON.stringify(result[0]), 2000, ''); // return ACP info. result�ɂ�acp�̌������ʂ������Ă���
        } else {
	    console.log('no data found');
            responder.error_result(request, response, 500, 5000, 'Exception Error.');
        }
    });
});

// (4) /das/acplist
// trid, or,usr�̓I�v�V�����A�I�v�V���������݂���ꍇ�́A���S��v��acp�e�[�u�����猟��
app.get('/das/acplist', function(request, response) {
    console.log('app.get ', request.query.params);
    //        console.log(Object.keys(request.query));
    db_sql.select_acplist(request, function(rsc, result) {});
});
// PUT
// ���\�[�X�̍X�V

// resource_uri���L�[�ɁAlookup�e�[�u������������
// ��v������̂�����ꍇ�́A���̃��R�[�h��ty���擾����
// ty�̎�ނɉ����āAcb/ae/cnt(/acp)�̃e�[�u����I�����Aurl��resource_uri�ƈ�v��������X�V���āA�X�V�����������X�|���X�Ƃ��ĕԂ�
//

app.put('/das/rce/_/:resource_uri', function(request, response) {
    console.log('app.put ', request.params);
    console.log(request.params['resource_uri']); // JSON�̗v�f���o�͂���

    var fullBody = '';
    request.on('data', function(chunk) {
        fullBody += chunk.toString();
    });
    request.on('end', function() {
        request.body = fullBody;
        if (request.body == "") {
            responder.error_result(request, response, 400, 4000, 'body is empty');
            return '0';
        }
        // Body���̃f�[�^�`�F�b�N�B���{�I�Ɍ������K�v������BJSON�ɕϊ����Ă��镔���͐������B
        parse_body_format(request, response, function(rsc, body_Obj) {
            if (rsc != '0') {
                request.url = request.params['resource_uri'];
                resource.update(request, response); // callback�Ō��ʂ�Ԃ��悤�ɕύX����
            }
        });
    });
});

// DELETE resource
// �����T�v�F
// resource_uri���L�[�ɁAlookup�e�[�u������������
// ��v������̂�����ꍇ�́A���̃��R�[�h��ty���擾����
// ty�̎�ނɉ����āAcb/ae/cnt(/acp)�̃e�[�u����I�����Aurl��resource_uri�ƈ�v��������폜���āA�폜�����������X�|���X�Ƃ��ĕԂ�

app.delete('/das/rce/_/:resource_uri', function (request, response) {
    console.log('app.delete ',request.params);
    request.url = request.params['resource_uri'];
    console.log(request.params['resource_uri']);  // JSON�̗v�f���o�͂���
    resource.delete(request, response); // callback�Ō��ʂ�Ԃ��悤�ɕύX����
});


if (process.env.NODE_ENV == 'production') {
    console.log("Production Mode");
} else if (process.env.NODE_ENV == 'development') {
    console.log("Development Mode");
}
