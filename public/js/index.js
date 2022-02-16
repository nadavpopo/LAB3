let typeUser = 'guest';
let userInfo = { 'UserName': '', 'Password': '', 'Type': 'guest' };
let tabs = [];
let guestTabs = [
    { "id": "aboutBtnId", "dataPage": "about", "label": "About" },
    { "id": "contactBtnId", "dataPage": "contact", "label": "Contact" }
];

async function refreshCurrentPage() {
    let currentPage = window.location.href.split('#')[1];
    renderPage(currentPage);
}

async function render() {
    window.addEventListener('keypress', (e) => (e.keyCode == 13) ? login() : '');
    userInfo.Type = 'guest';
    tabs = guestTabs;
    await renderPage('about');
    renderTabs();
    renderLogin();
}

function renderTabs() {
    let tabContainer = document.getElementById("tabContainerId");
    tabContainer.innerHTML = getTabHtmlByTypeUser();
}

function getTabHtmlByTypeUser() {
    let htmlText = '';
    tabs.forEach(tab => {
        htmlText += `
            <button data-page=${tab.dataPage} class="btn btn-outline-secondary" id=${tab.id} onclick="renderFromBtnPage()">${tab.label}</button>
        `;
    })
    return htmlText;
}

async function renderFromBtnPage() {
    let page = this.event.target.dataset.page;
    renderPage(page);
}

async function renderPage(page) {
    window.location.href = window.location.href.split('#')[0] + '#' + page;
    let mainContainer = document.getElementById("mainContainer");
    page = ((page == 'userManagement') || (page == 'productCatalog')) ? `${page}/${userInfo.UserName}` : page;
    mainContainer.innerHTML = await getMainHtml(page, {});
}

async function getMainHtml(page, options) {
    let data = await getDataFromServer(page, options);
    let htmlText = '';
    if ((page == 'about') || (page == 'contact')) {
        htmlText = getAboutOrContactHtml(data);
    } else if (page.includes('productCatalog')) {
        htmlText = getProductListHtml(data);
    } else if (page.includes('userManagement')) {
        htmlText = getUserManagementHtml(data);
    }
    return htmlText;
}

function getAboutOrContactHtml(data) {
    let htmlText = '';
    for (const property in data) {
        htmlText += `<${property} class="${property}">${data[property]}</${property}>`;
    };
    return htmlText;
}

function renderLogin() {
    let navId = document.getElementById("navId");
    navId.innerHTML = getLoginHtml();
}

function getLoginHtml() {
    let htmlText = ` 
                    <div class="text-white d-flex">
                        <input id="userNameInputId" class="form-control mr-2" type="text" placeholder="User Name">
                        <input id="passwordInputId" class="form-control mr-2" type="password" placeholder="Password">
                        <button type="button" class="btn btn-outline-primary" id="btnLoginId" onclick="login()">Login</button>
                    </div>
                `;
    return htmlText;
}

async function getProductListHtml(cards) {
    let allCardsHtml = '';
    cards.forEach(function (card, index) {
        allCardsHtml += getCardHtml(card.title, card.price, card.path);
    });
    let fullHtml = `
        <section class="section-products">    
            <div id="cardContainer">
                ${allCardsHtml}
            </div>
        </section>
    `;
    return fullHtml
}

function getCardHtml(title, price, path) {
    let htmlText = `
                    <div class="row prodCard">
                        <div class="">
                            <div id="product-1" class="single-product">
                                <div class="part-1">
                                    <img src="${path}"/>
                                </div>
                                <div class="part-2">
                                    <h3 class="h4">${title}</h3>
                                    <h4 class="product-old-price">${price.toFixed(2)}</h4>
                                    <h4 class="product-price">${(price * 0.7).toFixed(2)}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    return htmlText;
}

async function login() {
    let userName = document.getElementById("userNameInputId").value;
    let password = document.getElementById("passwordInputId").value;
    if (validateUserName(userName) && validatePassword(password)) {
        let data = await loginToServer(userName, password);
        if (data != null) {
            userInfo = data.userInfo;
            tabs = data.tabs;
            renderTabs();
            renderLoggedUser();
            renderPage('productCatalog');
        }
    }
}

function validateUserName(email) {
    let isValid = String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    (!isValid) ? alert(`User name "${email}" invalid you must insert valid email`) : '';
    return isValid;
};

function validatePassword(password) {
    let isValid = password.length > 3;
    (!isValid) ? alert(`Password "${password}" invalid you must insert password 4 or more characters `) : '';
    return isValid;
};

async function loginToServer(userName, password) {
    let data = { userName, password };
    const options = getOptions(data);
    const resJson = await getDataFromServer('login', options);
    return resJson;
}

function getOptions(data) {
    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
    return options;
}

function getUserManagementHtml(data) {
    let allTr = '';
    let allTh = '<th scope="col">#</th>';
    let index = 0;
    for (const property in data) {
        let allTd = `<td scope="row">${index + 1}</td>`
        let dataSet = '';
        for (const item in data[property]) {
            (index == 0) ? (allTh += `<th scope="col">${item}</th>`) : '';
            allTd += `<td scope="row">${data[property][item]}</td>`
            dataSet += ` data-${item.toLowerCase()}="${data[property][item]}" `;
        }
        allTd += getEdidTdHtml(property, data[property]);
        allTr += `<tr id=${property} data-index="${++index}" ${dataSet}>${allTd}</tr>`;
    }
    allTh += '<th scope="col" disebeld="true">Edit</th>';
    let typeArr = ['manager', 'customer', 'employee'];
    let optionHtml = '';
    typeArr.forEach(typeItem => {
        optionHtml += ((userInfo.Type == 'manager') || (typeItem == 'customer')) ? `<option value="${typeItem}">${typeItem}</option>` : '';
    });
    let htmlText = `
        <div class="d-flex mb-5 rounded border border-secondary p-5">
            <p class="col-3">Creata new user </p>
            <div class="col-3"><input id='username' class="form-control" placeholder="User name"/></div>
            <div class="col-2"><input id='password' class="form-control" placeholder="Password"/></div>
            <div class="col-2">
                <select class="form-select form-control" id='type'>${optionHtml}</select>
            </div>
            <div class="col-2">
                <button class="btn btn-outline-primary" onClick="insertNewRecord()">
                    <i class="glyphicon glyphicon-upload" style="font-size:15px;"></i>
                </button>
            </div>
        </div>
    `;
    let tableHtml = `<table class="table">
                        <thead>
                            <tr>
                                ${allTh}
                            </tr>
                        </thead>
                        <tbody>
                            ${allTr}
                        </tbody>
                    </table>`;
    htmlText += tableHtml;
    return htmlText;
}

function getEdidTdHtml(lineId) {
    let editable = (userInfo.Type == 'manager');
    let editTdHtml = `
        <td scope="row">
            <button data-line-id=${lineId}  class=${(editable) ? '"btn btn-outline-success"' : '"btn btn-secondary" disabled '}" onClick="editLine()" >Edit</button>
        </td>
    `;
    return editTdHtml;
}

function editLine() {
    let lineId = this.event.target.dataset.lineId;
    let line = document.getElementById(lineId);
    editLineById(lineId, line);
}

function editLineById(lineId, line) {
    let typeArr = ['manager', 'customer', 'employee'];
    let optionHtml = '';
    typeArr.forEach(typeItem => {
        optionHtml += (typeItem == line.dataset.type) ? `<option selected value="${typeItem}">${typeItem}</option>` : `<option value="${typeItem}">${typeItem}</option>`;
    });
    let allTd = `
            <td>${line.dataset.index}</td>
            <td><input id=${lineId + 'username'} data-line-id="${lineId}" class="form-control" value="${line.dataset.username}"/></td>
            <td><input id=${lineId + 'password'} data-line-id="${lineId}" class="form-control" value="${line.dataset.password}"/></td>
            <td>
                <select id=${lineId + 'type'} class="form-select form-control">${optionHtml}</select >
            </td> 
            <td>
                <button class="btn btn-outline-primary" data-line-id="${lineId}" onClick="saveRecord()">
                    <i class="glyphicon glyphicon-upload" style="font-size:15px;" data-line-id="${lineId}"></i>
                </button>
                <button class="btn btn-outline-danger" data-line-id="${lineId}" onClick="deleteRecord()">
                    <i class="glyphicon glyphicon-trash" style="font-size:15px;" data-line-id="${lineId}"></i>
                </button>
                <button class="btn btn-outline-warning" data-line-id="${lineId}" onClick="cencelEditRecord()">X</button>
            </td>
    `;
    line.innerHTML = allTd;
}

function saveRecord() {
    let lineId = this.event.target.dataset.lineId;
    upsertRecord(lineId);
}

async function upsertRecord(lineId) {
    let record = createNewRecord(lineId);
    let action = 'upsert';
    lineId = (lineId == '') ? record["UserName"] : lineId;
    let body = { "lineId": lineId, record, action, 'userName': userInfo.UserName };
    let options = getOptions(body);
    if (validateUserName(record["UserName"]) && validatePassword(record["Password"])) {
        let data = await getDataFromServer('editUserManagement', options);
    }
    await renderPage('userManagement');
}

function createNewRecord(lineId) {
    let username = document.getElementById(lineId + 'username');
    let password = document.getElementById(lineId + 'password');
    let type = document.getElementById(lineId + 'type');
    let newRecord = { "UserName": username.value, "Password": password.value, "Type": type.value };
    return newRecord;
}

function renderRecord(line, htmlRecord) {
    line.innerHTML = htmlRecord;
}

function cencelEditRecord() {
    let lineId = this.event.target.dataset.lineId;
    let line = document.getElementById(lineId);
    let index = line.dataset.index;
    let username = line.dataset.username;
    let password = line.dataset.password;
    let type = line.dataset.type;
    renderRecord(line, getRecordHtml(index, username, password, type));
}

function getRecordHtml(index, username, password, type) {
    let recordHtml = `
        <td>${index}</td>
        <td>${username}</td>
        <td>${password}</td>
        <td>${type}</td>
        <td><button data-line-id=${username} class="btn btn-outline-success" onClick="editLine()">Edit</button></td>
    `;
    return recordHtml;
}

async function deleteRecord() {
    let lineId = this.event.target.dataset.lineId;
    let action = 'delete';
    let body = { lineId, action, 'userName': userInfo.UserName };
    let options = getOptions(body);
    let data = await getDataFromServer('editUserManagement', options);
    renderPage('userManagement');
}

function renderLoggedUser() {
    let navId = document.getElementById("navId");
    navId.innerHTML = getLoggedUserHtml(userInfo.UserName);
}

function getLoggedUserHtml(userName) {
    let htmlText = `
            <div class="loggedUser p-4" >
                <p class="p-2 text-danger">${userInfo.UserName}</p>
                <p class="p-2 text-danger">${userInfo.Type}</p>
                <i class="glyphicon glyphicon-user my-3" style="font-size:24px; color: red;"></i>
                <button type="button" class="btn btn-outline-danger" onclick="loggedOut()">Logged Out</button>
                <button class="mt-2 btn btn-outline-info glyphicon glyphicon-refresh" style="font-size:15px;" onclick="refreshCurrentPage()"></button>
            </div>
        `;
    return htmlText;
}

function insertNewRecord() {
    upsertRecord('');
}

function loggedOut() {
    let body = {};
    let options = getOptions(body);
    getDataFromServer('loggedOut', options);
    render();
}

async function getDataFromServer(url, options) {
    let containerLoaderId = document.getElementById("containerLoaderId");
    containerLoaderId.style = "display: black;";
    let json = '';
    let isTooLongTime = false;
    setTimeout(() => {
        if (json == '') {
            alert('Too long time please refresh your page');
            isTooLongTime = true;
            return;
        }
    }, 5000);
    try {
        let res = await fetch(('/' + url), options);
        json = await res.json();
        if (res.status == 200) {
            if (!isTooLongTime) {
                containerLoaderId.style = "display: none;";
                console.log('getDataFromServer json ---> ', json);
                return json;
            }
        } else {
            alert(`${json.error} please refresh your page`);
        }
    } catch (error) {
        console.error('Error: ', error);
    }
}