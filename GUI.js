import Country from "./Country.js";
import DB_Actions from "./DB_Actions.js";

class GUI {
    constructor() {
        this.attempts = 0;
        this.country = null;
        this.hasCountryList = false;
        this.allCountries = new Array();
    }

    getCardinal(c1, c2) {
        let directions = {
            leste: { number: 0, arrow:"→"},
            nordeste: { number: 45, arrow:"↗"},
            norte: { number: 90, arrow:"↑"},
            noroeste: { number: 135, arrow:"↖"},
            oeste: { number: 180, arrow:"←"},
            sudoeste: { number: 255, arrow:"↙"},
            sul: { number: 270, arrow:"↓"},
            sudeste: { number: 315, arrow:"↘"},
        }
        
        let angle = Math.atan2(c2.lat - c1.lat, c2.long - c1.long) * 180 / Math.PI;
        let direction;
        for(let key in directions) {
            if(angle > directions[key]["number"]) {
                direction = directions[key]["arrow"];
            }
        }

        console.log(angle, direction);

        return direction;
    }

    showCountry(country) {
        let changeMessage = (text) => {
            let message = document.querySelector("#message");
            message.innerHTML = text;
        }

        let printCountry = (fieldColors, country) => {
            for (let key in country) {
                let field = document.createElement("div");
                field.className = `country-field ${fieldColors[key]}`;

                let info = document.createElement("p");
                info.textContent = country[key];
                if(key == "direction") info.id = "direction";

                let label = document.createElement("p");
                label.textContent = key;
                label.className = "country-label";

                field.appendChild(label);
                field.appendChild(info);
                li.appendChild(field);
            }

            ul.appendChild(li);
        }

        let win = false;
        let lose = false;
        let answer = {...localStorage};

        if(country == undefined) {
            changeMessage("Erro: O país não existe!");
            return;
        }

        if(country.name == localStorage.getItem("name")) {
            changeMessage(`Acertou! O país é ${country.name}`);
            win = true;
        }

        if (localStorage.attempts >= 5) {
            changeMessage(`Fim de jogo! O país é ${answer.name}`);
            lose = true;
        }
        
        // Limpando o que ficou do localStorage
        Object.keys(answer).map(key => { if (!Object.keys(country).includes(key)) delete answer[key] });
        
        let c1 = {
            lat: country.lat,
            long: country.long
        }

        let c2 = {
            lat: answer.lat,
            long: answer.long
        }

        // Calculando a direção
        country["direction"] = this.getCardinal(c1, c2);

        let ul = document.querySelector("#attempts");
        let li = document.createElement("li");

        let colors = {
            wrong: "red",
            right: "green",
            mid: "yellow",
            default: "blue"
        }

        let fieldColors = {};
        for(let key in country) {
            if(win) {
                fieldColors[key] = colors.right;
                continue;
            }

            if(lose) {
                fieldColors[key] = colors.default;
                continue;
            }
            
            if(key == "hemisphere" || key == "continent") {
                (country[key] == answer[key]) ? fieldColors[key] = colors.right : fieldColors[key] = colors.wrong;
                continue;
            }
            
            if(key == "population") {
                let difference = ((country[key] / answer[key]));
                console.log(`${country[key]} / ${answer[key]} = ${difference}`);
                
                if(difference >= 0.8 || difference <= 1.2) {
                    fieldColors[key] = colors.right;
                } else if(difference >= 0.6 || difference <= 1.4) {
                    fieldColors[key] = colors.mid;
                } else {
                    fieldColors[key] = colors.wrong;
                }
                if(difference == Infinity) {
                    fieldColors[key] = colors.wrong;
                }
                continue;
            }

            fieldColors[key] = colors.default;
        }

        //console.log(fieldColors);

        delete country["name"];
        
        printCountry(fieldColors, country);
        localStorage.setItem("attempts", Number(answer.attempts) + 1);

        if(lose) {
            printCountry(answer);
        }
    }

    dbAction(object, action) {
        let changeMessage = (text) => {
            let message = document.querySelector("#message");
            message.innerHTML = `Erro: ${text}`;
        }
        let allCountries = object;

        let compare = this.showCountry.bind(this);
        
        let openRequest = indexedDB.open("countries", 1);
        openRequest.onupgradeneeded = function () {
            let db = openRequest.result;
            switch (event.oldVersion) {
                case 0:
                    db.createObjectStore("countries", { keyPath: 'name' });
                    break;
                default:
                    return;
            }
        };

        openRequest.onsuccess = function () {
            let db = openRequest.result;
            let transaction = db.transaction("countries", "readwrite");
            let request = transaction.objectStore("countries");
            
            switch(action) {
                case DB_Actions.POPULATE:
                    console.log("popular");
                    allCountries.map(country => {
                        let countriesReq = request.add(country);
        
                        countriesReq.onsuccess = function () {
                            console.log("País entrou no banco", countriesReq.result);
                        };
                        countriesReq.onerror = function () { changeMessage(countriesReq.error); };
                    });
        
                    //localStorage.setItem("hasDB", "yes");
                    break;

                case DB_Actions.SETUP_GAME:
                    let allReq = request.getAll();
                    let datalist = document.querySelector("datalist");

                    let randomNum = () => {
                        return parseInt(Math.random() * 255);
                    }

                    allReq.onsuccess = function () {
                        if(allReq.result.length < 1) {
                            localStorage.removeItem("hasList")
                            console.log("result", allReq.result);
                            return;
                        }
                        
                        // Preenche datalist
                        allReq.result.map(c => {
                            let option = document.createElement("option");
                            option.value = c.name;
                            datalist.appendChild(option);
                        });

                        localStorage.setItem("hasList", "true");

                        let selectedCountry = allReq.result[randomNum()];
                        for (let key in selectedCountry) {
                            localStorage.setItem(key, selectedCountry[key]);
                        }
                        
                    }
                    allReq.onerror = function () { changeMessage(allReq.error); }

                    break;

                case DB_Actions.GET:
                    let country = object;
                    let getReq = request.get(country);

                    getReq.onsuccess = function () { compare(getReq.result); }
                    getReq.onerror = function () { changeMessage(getReq.error); }
                    
                    break;
                default:
                    break;
            }
        }

        openRequest.onerror = function () {
            let message = document.querySelector("#message");
            message.innerHTML += `Erro: ${openRequest.error}`;
            return;
        };
    }

    fetchAllCountries() {
        let store = this.dbAction.bind(this);
        
        let restCountriesURL = "https://restcountries.com/v3.1/all?fields=name,region,continents,population,latlng"
        let p = fetch(restCountriesURL, { method: 'GET' });
        
        let allCountries = new Array();

        p.then(response => response.json()).then(function (countries) {
            countries.sort((c) => c.name.common);
            countries.map((c) => {
                let country = new Country(c.name.common, c.continents[0], c.population,
                                          c.latlng[0].toFixed(3), c.latlng[1].toFixed(3));

                allCountries.push(country);
            });

            store(allCountries, DB_Actions.POPULATE);
        });
    }

    play(event) {
        let listInput = document.querySelector("#selected-country");
        let country = listInput.value;
        listInput.value = "";
        console.log(localStorage.getItem("attempts"));

        if(!country.trim().length) console.error("País vazio");
        this.dbAction(country, DB_Actions.GET);
    }

    init() {        
        localStorage.setItem("attempts", 0);
        let dbExists = localStorage.getItem("hasList");
        if(!dbExists) {
            this.fetchAllCountries();
        }

        this.dbAction(null, DB_Actions.SETUP_GAME);    // Preenche o datalist  
        
        let inputList = document.querySelector("#selected-country");
        let button = document.querySelector("button");

        inputList.addEventListener(["keydown"], (event) => {
            if(event.code == "Enter"){
                console.log(event.code);
                event.preventDefault();
                this.play.bind(this);
            }
            inputList.innerHTML = "";
        });

        button.onclick = this.play.bind(this);
    }

}

let gui = new GUI();
gui.init();