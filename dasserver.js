/**
 * Copyright (c) 2019, KDDI Research, Inc.
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var fs = require('fs');
var data = fs.readFileSync('conf.json', 'utf-8');
var conf = JSON.parse(data);

global.defaultbodytype      = 'json';

// my CSE information
// 以下の情報は殆どが不要
// global.usecsetype           = 'in'; // select 'in' or 'mn' or asn'
// global.usecsebase           = 'Mobius';
// global.usecseid             = '/Mobius2';
 global.usedasbaseport       = conf.dasbaseport;
 global.usedbhost            = 'localhost';
 global.usedbpass            = conf.dbpass;
// global.usepxywsport         = '7577';
// global.usepxymqttport       = '7578';
// global.use_sgn_man_port     = '7599';
// global.use_hit_man_port     = '7594';
// global.usetsagentport       = '7582';
// global.use_mqtt_broker      = 'localhost'; // mqttbroker for mobius
 global.use_secure           = 'disable';
// global.use_mqtt_port        = '1883';
// if(use_secure === 'enable') {
//     use_mqtt_port           = '8883';
// }
// global.useaccesscontrolpolicy = 'disable';
// global.allowed_ae_ids = [];
// global.allowed_app_ids = [];
// global.usesemanticbroker    = '10.10.202.114';
// global.uservi = '2a';

// DAS core
require('./app');
