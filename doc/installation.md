# DAS
## Introduction
DAS platform is a oneM2M compliant IoT Dynamic Authorization System server platform designed to offer a flexible access control decision mechanism for accessing resource from IoT application and devices. Figure 1 shows the architecture of DAS platform structured with oneM2M entities and reference points.









Figure 1 oneM2M complied DAS platform architecture

DAS platform provides a series of REST APIs for protocol HTTP to realize dynamic access control mechanism between IoT applications and devices through IN-CSE as shown in Figure2. APIs for creation and retrieval of oneM2M resources and access control policies are also provided to simplify the procedures of authorization management.









Figure 2 Interconnection between DAS and IoT applications/devices and IN-CSE

## DAS Platform

### Introduction

DAS is a middleware server platform that creates virtual representations (oneM2M resources) and access control policy for each IoT device to enable the dynamic authorization system for devices and IoT applications.  Figure 3 shows the components of DAS platform i.e.  IoT applications/devices, IN-CSE, and DAS Server/DAS-AE(s).







Figure 3 DAS platform components

The IoT Dynamic Authorization System server platform can be implemented using diverse programming languages and the DAS server platform is developed using Node JS. In addition, DAS server platform uses Node JS express modules which provides diverse modules for developers including HTTP instead of Node JS express framework.
The DAS server platform is compliant to oneM2M standards and supports HTTP bindings specified in oneM2M standards. The DAS server platform implements oneM2M Dynamic Authorization System server with structured resource architectures and access control policy info provides authorization decision function through RESTful APIs. The DAS server platform uses MySQL DBMS for resources and access control policy and access token storage.

### Functionalities

DAS Server will provide the following functionalities to realize the dynamic authorization system for resource access requests from IoT applications and devices. 

- Manage resource (mainly AE,container) info stored in IN-CSE

- Manage ACP info related to a specific resource for an originator 

- Receive access control info/tokenid/roleid from IN-CSE/Originator and Response to IN-CSE/Originator with generated access control policy info/granted permission info or access token. Adhering to oneM2M DAS specific protocol to communicate with IN-CSE

- Manage access token information 

- Support JWT for secure communication

  

The call flows as shown in Figure 4 indicates the communications and interactions among devices, IoT applications, IN-CSE and DAS.

  

  

  

  

  Figure 4 DAS interaction with IoT devices, applications, and IN-CSE

### Components

Mobius server consists of HTTP server and MySQL DBMS while IoT applications implement HTTP clients in order to communicate with DAS server directly or indirectly via IN-CSE.









Figure 5 DAS platform components

### S/W Architecture

For protocol binding support, DAS has HTTP server internally.  Mainly it consists of requester and responder. The requester contains the DB access component. Every HTTP request is go through requester component, parser, actor and then create SQL query to data access (e.g. retrieval, discovery) with DB connector. When it gets access result, the responder creates the response in  JSON serialization.









Figure 6 DAS platform S/W architecture

### Source Code Directory

The figure below shows the DAS Node JS source directory. For the detailed functions and
roles for each Node JS file, please refer to the Table 1.
```
│─ app-ae.js
│─  app.js
│─  conf-ae.json
│─  conf.json
│─  das-ae.js
│─  dasserver.js
│─  package.json
│─  README.md
│─  server-crt.pem
│─  server-key.pem
│
└─das (directory)
        │─ dasdb.sql
        │─ db_action.js
        │─ resource.js
        │─ responder.js
        │─ sql_action.js
        │─ time-check.js
        └─token.js
```
Figure 7 DAS Node JS source code directory

  - Table 1 Function Reference Table for Node JS Files
| TH1 | TH2 |
----|---- 
| TD1 | TD3 |
| TD2 | TD4 |

| Source File       | Role and Function                                            |
|:-----------------|:------------------------------------------------------------|
| app.js            | This file acts as role of flow router and it is the main code running Mobius-YT server.<br/>① It handles initial processing of received packets.<br/>② It initiates HTTP server with ‘listening’ mode to wait for HTTP requests target to the DAS HTTP server.<br/>③ It handles the parsing of URL of packets and evaluate the correctness of the request body resulted of parsing. It then sends the request to resource.js to continue the processing if the request is valid one, otherwise throws exceptions.<br/>④ It also contains the logic for checking access control information received from IN-CSE to generate temporal access control policy or granting permission. |
| app-ae.js         | This file acts as role of flow router and it is the main code running Mobius-YT server.<br/>① It handles initial processing of received packets.<br/>② It initiates HTTP server with ‘listening’ mode to wait for HTTP requests target to the DAS AE HTTP server.<br/>③ It handles the parsing of URL of packets and evaluate the correctness of the request body resulted of parsing. If the request is targeted to DAS Server, it forwards the request to DAS Server.<br />④ It registers itself to IN-CSE to enable a trusted communication. |
| dasserver.js      | This file initiates DAS server and helps loading main Node JS files.<br/>It also contains configuration parameters for DAS server such as defaultbodytype indicating the serialization, usecsebase<br/>indicating CSEBase name, usecseid indicating CSEID, usedbhost indicating the host address running MySQL, and usedbpass indicating the password for MySQL etc. Users can modify those configuration parameters. |
| das-ae.js         | This file initiates DAS AE and helps loading main Node JS files.<br/>It also contains configuration parameters for DAS AE such as  usecsebase indicating CSEBase name, usecseid indicating CSEID etc. Users can modify those configuration parameters. |
| das/db_action.js  | This file contains parameters used to connect and access to the database and parameters for returning response results from the database. |
| das/resource.js   | It is core file to process the CREATE, RETRIEVE, UPDATE, DELETE, NOTIFY and DISCOVERY operations for oneM2M resource primitives, access control info, and tokens.<br/>This file undertakes the processing of parsed request URI and request body received from app.js according to corresponding operation. It converts the data into a format to process the data and connect to mysql database.<br/>The mysql database is initialized and handled by db_action.js and sql_action.js module. |
| das/responder.js  | It is responsible for handling the response process.<br/>It receives processing results from app.js and resource.js modules and generates responses from the processing results in JSON serialization format. |
| das/sql_action.js | This file contains functions to receive data and parameters required for a series of database operations and functions to call db_action.js module to return data from database. |
| das/time-check.js | This file contains functions to realizing the time-window based access control mechanism. |
| das/token.js      | This file contains functions to generate and store access tokens. |

### Access Control determining logic
In oneM2M spec, DAS check the access control information received from IN-CSE to dynamically authorize the access request from IoT application, devices (i.e. request originator) targeted to the resource stored in IN-CSE.  The following info can be included in these access control information.

- request originator (mandatory)
- request operation (mandatory)
- ip address (v4 or v6) of request originator (optional)
- timestmap when the request has been received from request originator at IN-CSE (optional)
- location of the request originator (optional)

oneM2M spec does not specify how to handle these information, so our software implement a sample logic to check these information as followings:

When these information are included in the dynamic authorization request received from IN-CSE, DAS Server will compare them with the access control policy (ACP) of requested target resource which is stored in the Auth info repository of DAS. 

- If request originator and operation does NOT match to/allow with the stored ACP info, the request will be rejected and Error is returned. 
- If any of optional information does NOT match to/included in allowed ip address(es) or NOT fall into the range of time-window or circle region or the NOT matched to the list of allowed country code(s) of the given access control policy, then request will be rejected and response with no error and empty data related access control policy will be sent back. 
- In other case,  a temporal access control policy information or granted permission using dynamicACPinfo or access token will be returned. Then IN-CSE will make a final access control decision by using the received info . 

### API list

DAS is providing Restful API to manage the resource and ACP info, and dynamic authorization function.  Table 2 shows the supported list of APIs.

  - Table 2 API lists

    | Functionality       | URI  |  Method |
    |:-----------------|:------------------------------------------------------------|:------|
    | dynamic Authorization|das/dynaAuth	|POST|
    | create resource|das/rce	|POST|
    |   retrieve resource|das/rce/_/{resource_uri}|	GET|
    |update resource	|das/rce/_/{resource_uri}|	PUT|
    |delete resource	|das/rce/_/{resource_uri}|	DELETE|
	| retrieve resource list|das/rceList|	GET|
	| create ACP|	das/acp|	POST|
	| retrieve ACP| 	das/acp|	GET|
	| update ACP|	das/acp	|PUT|
	| delete ACP|	das/acp|	DELETE|
	| retrieve ACP list|	das/acpList|	GET|
	| create token| das/token|	POST|

# DAS Server Platform Installation

## DAS install procedure ( Azure Ubuntu Server 18.04 LTS )

DAS is constructed with Node JS and MySQL and consequently support multi OS platform including Linux, Windows, Mac.  In this install manual, we just describe how to install DAS on Azure Ubuntu Server 18.04.  For  installation procedure on any other environment, please refer Node JS and MySQL official installation guide.

## 1.MySQL
```
$ sudo apt update
$ sudo apt install mysql-client
$ sudo apt install mysql-server
$ sudo service mysql start
```

## 2.Node.js
### 2.1 nvm install
```
git clone https://github.com/creationix/nvm.git ~/.nvm
source ~/.nvm/nvm.sh
```

### 2.2 node install (ver12.9.0 or later)
```
$ nvm ls-remote
$ nvm install 12.9.0
$ node -v
v12.9.0
```

## 3.DAS Server
### 3.1 DAS Install

```
$ cd ~/
$ git clone https://github.com/IoTKETI/DAS.git
$ cd DAS/
$ npm install
```

### 3.2 Import data into mysql

```
$ mysql -u root -p
mysql> create database dasdb;
mysql> exit

```
Import data into dasdb database
```
$ mysql -u root -p dasdb < ~/DAS/das/dasdb.sql
```

### 3.3 Configure DAS setup file

```
$ sudo vi ~/DAS/conf.json
```

dasbaseport is the service port number for DAS server

```
{
	"dasbaseport": Port number of DAS server
	"dbpass": Password to access mysql
}

(sample)
{
	"dasbaseport": "7580"
	"dbpass": "password"
}
```

### 3.4 Start DAS server

```
$ node dasserver.js
Start DAS server!
Connecting to mysql!
das server (http) (10.0.75.1) running at 7580 port
```

### 3.5 Starting DAS in background

```
$ nohup node dasserver.js &
```

## 4. DAS-AE

### 4.1 Configure DAS-AE setup file

```
$ sudo vi ~/DAS/conf-ae.json
```

dasaebaseport is the service port number for DAS-AE module

```
{
    "dasaebaseport": Port number of DAS-AE module
}

(sample)
{
    "dasaebaseport": "7581"
}
```

### 4.2 Configure CSE/DAS info
```
$ sudo vi ~/DAS/das-ae.js
```


```
// DAS information
 global.usedashost	    = 'localhost';
 global.usedasport	    = '7580';

// CSE information
 global.usecsehost      = 'ocean.local.com';
 global.usecseport      = '7579';
 global.usespid         = '//sample.a';
 global.usecseid        = '/mb-cse-a';
 global.usecsebase      = 'mb-base-a';
```


### 4.3 Start DAS-AE  module

```
$ node das-ae.js
Start DAS-AE!
DAS-AEID= SxOdKDLb9ty
das-ae (http) (10.0.75.1) running at 7581 port
```

4.4 How to setup DAS-AE resource in IN-CSE



## Testing tools

[SwaggerEditor](https://editor.swagger.io/)
[YAML file for SwaggerEditor]()

[Postman](https://www.getpostman.com/)
[End]

