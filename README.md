# DAS Installation
-------------------

## DAS install procedure ( Azure Ubuntu Server 18.04 LTS )

## 1.MySQL
```
$ sudo apt update
$ sudo apt install mysql-client
$ sudo apt install mysql-server
$ sudo service mysql start
```

## 2.Node.js
```
$ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
$ sudo apt install -y nodejs
$ node -v
v8.10.0
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
Import data into dassdb datavase
```
$ mysql -u root -p dasdb < ~/DAS/das/dasdb.sql
```

### 3.3 Configure DAS setup file

```
$ sudo vi ~/DAS/conf.json
```

csebaseport is the service port number for DAS server

```
{
	"csebaseport": Port number of DAS server
	"dbpass": Password to access mysql
}
```

### 3.4 Start DAS server

```
# node dasserver.js

Start DAS server!
Connecting to mysql!
Development Mode
das server (http) (10.0.75.1) running at XXXX port
```

### 3.5 Starting DAS in background

```
# nohup node dasserver.js &
```


## A.Testing tools

[Postman](https://www.getpostman.com/)

[SwaggerEditor](https://editor.swagger.io/)

[End]
