# DAS
oneM2M IoT Dynamic Authorization System Server Platform

## Version
1.0.x

## Introduction
DAS is the open source IoT authorization server platform based on the oneM2M (http://www.oneM2M.org) standard. As oneM2M specifies, DAS provides dynamic authorization on behalf of resources owners. Not just oneM2M devices, but also non-oneM2M devices (i.e. by oneM2M interworking specifications) can connect to DAS.

## Background
DAS has been developed in the project called PARMMIT (Personal data Access Recording Management & Multi-platform Interconnection Technologies), which targets to develop a personal IoT Service platform for managing mainly biological information.

DAS is also targeted to connect to APPM (Advanced Privacy Preference Management), which realizes a mechanism for controlling and managing a flow of (personal) information based on  agreement of the data subject.

It is also designed to connect to CSE server platform like 'WDC' (formerly known as '[Mobius](https://github.com/IoTKETI/Mobius)') to exchange authorization information dynamically.

## System Structure
In oneM2M architecture, DAS implements the DAS Server which could be the cloud server. IoT applications communicate with DAS directly or via IN-CSE.

<div align="center">
<img src="https://user-images.githubusercontent.com/29790334/28322739-d7fddbc4-6c11-11e7-9180-827be6d997f0.png" width="800"/>
</div>

## Connectivity Structure
To enable Internet of Things, things are connected to IN-CSE via IoT/M2M Gateway, then IN-CSE communicate with DAS over oneM2M standard APIs. Also IoT applications use DAS APIs to retrieve access token from DAS.

<div align="center">
<img src="https://user-images.githubusercontent.com/46951390/76373097-d0e83a80-6382-11ea-9306-dc19d3029591.png" width="800"/>
</div>

## Software Architecture

<div align="center">
<img src="https://user-images.githubusercontent.com/29790334/28245393-a1159d5e-6a40-11e7-8948-4262bf29c371.png" width="800"/>
</div>

## Supported Protocol Bindings
- HTTP

## Requirement
- node.js 12.9.0 or later
- mysql  5.7

## Installation
The DAS is based on Node.js framework and uses MySQL for database.
- [MySQL Server](https://www.mysql.com/downloads/)<br/>
The MySQL is an open source RDB database so that it is free and light. RDB is very suitable for storing tree data just like oneM2M resource structure. 

- [Node.js](https://nodejs.org/en/)<br/>
Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient. Node.js' package ecosystem, npm, is the largest ecosystem of open source libraries in the world. Node.js is very powerful in service implementation because it provide a rich and free web service API. So, we use it to make RESTful API base on the oneM2M standard.

- [DAS](https://github.com/IoTKETI/DAS/archive/master.zip)<br/>
DAS source codes are written in JavaScript. So they don't need any compilation or installation before running.

## Configuration
- Import SQL script<br/>
After installation of MySQL server, you need the DB Schema for storing oneM2M resources in DAS. You can find this file in the following DAS source directory.
```
[das home]/das/dasdb.sql
```
- Open the DAS source home directory
- Install dependent libraries as below
```
npm install
```
- Modify the configuration file "conf.json" and "conf-ae.json" per your setting

conf.json
```
{
  "dasbaseport": "7580", // DAS HTTP hosting  port
  "dbpass": "*******"    // MySQL root password
}
```

conf-ae.json

```
{
  "dasaebaseport": "7581" // DAS-AE HTTP hosting  port
}
```

## Usage

Use node.js application execution command as below.

dasserver

```
node dasserver.js
```

<div align="center">
<img src="https://user-images.githubusercontent.com/46951390/76301669-fb45e380-6301-11ea-9357-f9913640f00e.png" width="700"/>
</div><br/>

das-ae

```
node das-ae.js
```

<div align="center">
<img src="https://user-images.githubusercontent.com/46951390/76301776-31836300-6302-11ea-9eaa-b554443fdaa2.png" width="700"/>
</div><br/>

## Library Dependencies
This is the list of library dependencies for DAS
- body-parser
- express
- file-stream-rotator
- geolocation-utils
- fs
- http
- https
- ip
- ip-range-check
- ipaddr.js
- jose
- moment
- morgan
- mysql
- path-to-regexp
- shortid
- url
- util

## Document
If you want more details please see the full [installation guide document](https://github.com/IoTKETI/DAS/raw/master/doc/installation.md).

## Note

- 

## Author
Norihiro Okui (no-okui@kddi.com)
Michiyoshi Sato (xmi-sato@tsm.kddi-research.jp)

## License

DAS is licensed under the [BSD 3-Clause](https://en.wikipedia.org/wiki/BSD_licenses#3-clause_license_(%22BSD_License_2.0%22,_%22Revised_BSD_License%22,_%22New_BSD_License%22,_or_%22Modified_BSD_License%22)). 