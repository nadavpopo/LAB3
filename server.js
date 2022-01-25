const path = require('path');
const express = require('express');
const fs = require('fs');

const app = express();
const port = 8080;
const dataBase = require('./dataBase.json');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/about', function (req, res) {
  setTimeout(() => {
    res.json(dataBase.About);
  }, 1000);
});

app.get('/contact', function (req, res) {
  setTimeout(() => {
    res.json(dataBase.Contact);
  }, 1000);
});

app.get('/productCatalog/:userName', function (req, res) {

  // if (userAuthentication(req.params.userName)) {
  setTimeout(() => {
    res.json(dataBase.ProductCatalog);
  }, 1000);
  // }
});

app.get('/userManagement/:userName', function (req, res) {
  if (userAuthentication(req.params.userName)) {
    let type = dataBase.UserManagement[req.params.userName].Type;
    let userDataByPermissions = getUserDataByPermissions(type);
    setTimeout(() => {
      res.json(userDataByPermissions);
    }, 1000);
  }
});

app.post('/login', (req, res) => {
  let userName = req.body.userName;
  let userPass = req.body.password;
  let userInfo = dataBase.UserManagement[userName];
  setTimeout(() => {
    (userAuthenticationLogin(userName, userPass)) ? res.json({ "userInfo": userInfo, "tabs": getAllTabs(userName) }) : res.status(200);
  }, 1000);
});

app.post('/editUserManagement', function (req, res) {
  // if (userAuthentication(req.body.userName)) {
  let lineId = req.body.lineId;
  if (dataBase.UserManagement[lineId] != null) {
    dataBase.UserManagement[lineId].IsActive = false;
  }
  if (req.body.action == 'upsert') {
    let newRecord = req.body.record;
    newRecord["IsActive"] = true;
    dataBase.UserManagement[newRecord.UserName] = newRecord;
  }
  writeToJson('UserManagement', dataBase.UserManagement);
  // }
  let userDataByPermissions = getUserDataByPermissions(req.body.Type);
  setTimeout(() => {
    res.json(userDataByPermissions);
  }, 1000);
});

app.post('/loggedOut', (req, res) => {
  setTimeout(() => {
    res.json({});
  }, 1000);
});

function getAllTabs(userName) {
  let tabsAccessAllowed = dataBase.ManagementHierarchyTab[dataBase.UserManagement[userName].Type];
  let allTabs = [];
  tabsAccessAllowed.forEach(item => {
    allTabs.push(dataBase.Tabs[item]);
  });
  return allTabs;
}

app.listen(port);

function userAuthenticationLogin(userName, userPass) {
  let user = dataBase.UserManagement[userName];
  let isValid = ((user.Password == userPass) && (user.IsActive == true));
  return isValid;
}

function userAuthentication(userNameToFound) {
  // let obj = dataBase.UserManagement.find(item => item.UserName == userNameToFound);
  // console.log('obj ---> ', obj);
  return true;
}

function getUserDataByPermissions(type) {
  let userDataByPermissions = {};
  if (type == 'customer') {
    userDataByPermissions = {};
  } else {
    for (const [key, value] of Object.entries(dataBase.UserManagement)) {
      if (value.IsActive == true) {
        let item = { "UserName": value.UserName, "Password": (type == 'employee' ? '*************' : value.Password), "Type": value.Type };
        ((type == 'manager') || (value.Type == 'customer')) ? (userDataByPermissions[value.UserName] = item) : '';
      }
    }
  }
  return userDataByPermissions;
}

function writeToJson(fieldName, value) {
  let path = './dataBase.json';
  let file = fs.readFileSync(path, "utf8");
  let jsonFile = JSON.parse(file);
  jsonFile[fieldName] = value;
  jsonFile = JSON.stringify(jsonFile, null, 4);

  fs.writeFile(path, jsonFile, err => {
    if (err) {
      console.error(err)
      return
    }
  })
}