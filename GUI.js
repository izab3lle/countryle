import Country from "./Country.js";
import DB_Actions from "./DB_Actions.js";

class GUI {
    constructor() {
        this.attempts = 0;
        this.country = null;
        this.hasCountryList = false;
        this.allCountries = new Array();
    }

    showCountry(country) {
        if(country == undefined) {
            let message = document.querySelector("#message");
            message.innerHTML = `Erro: O país não existe!`;
            return;
        }

        let ul = document.querySelector("#attempts");
        let li = document.createElement("li");

        delete country["name"];
        
        for(let key in country) {
            let field = document.createElement("div");
            field.className = "country-field red";
            
            let info = document.createElement("p");
            info.textContent = country[key];
            
            let label = document.createElement("p");
            label.textContent = key;
            label.className = "country-label";
            
            field.appendChild(label);
            field.appendChild(info);
            li.appendChild(field);
        }

        ul.appendChild(li);
        console.log("??");
    }

    dbAction(object, action) {
        let changeMessage = (text) => {
            let message = document.querySelector("#message");
            message.innerHTML = `Erro: ${text}`;
        }

        let compare = this.showCountry;
        
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
                    let allCountries = object;
                    allCountries.map(country => {
                        let countriesReq = request.add(country);
        
                        countriesReq.onsuccess = function () {
                            console.log("País entrou no banco", countriesReq.result);
                        };
                        countriesReq.onerror = function () { changeMessage(countriesReq.error); };
                    });
        
                    //localStorage.setItem("hasDB", "yes");
                    break;

                case DB_Actions.GET_ALL:
                    let allReq = request.getAll();

                    allReq.onsuccess = function () {
                        if(allReq.result.length == 0) return false;
                        
                        let datalist = document.querySelector("datalist");
                        allReq.result.map(c => {
                            let option = document.createElement("option");
                            option.value = c.name;
                            datalist.appendChild(option);
                        });
                    }
                    allReq.onerror = function () { changeMessage(allReq.error); }
                    return true;
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

    storeCountries(allCountries) {
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
            let countries = transaction.objectStore("countries");

            allCountries.map(country => {
                let request = countries.add(country);

                request.onsuccess = function () {
                    console.log("País entrou no banco", request.result);
                };

                request.onerror = function () {
                    let message = document.querySelector("#message");
                    message.innerHTML = `Erro: ${request.error}`;
                };
            });

            localStorage.setItem("hasDB", "yes");
        }
        
        openRequest.onerror = function () {
            let message = document.querySelector("#message");
            message.innerHTML += `Erro: ${openRequest.error}`;
            return;
        };
    }

    getCountry(name) {
        let openRequest = indexedDB.open("countries", 1);

        let compare = this.compare;
        openRequest.onupgradeneeded = function () { };

        openRequest.onsuccess = function () {
            let db = openRequest.result;
            let transaction = db.transaction("countries", "readonly");
            let request = transaction.objectStore("countries");
            request = request.get(name);

            request.onsuccess = function () {
                compare(request.result);
            }

            request.onerror = function () {
                return undefined;
            }
        }

        openRequest.onerror = function () {
            let message = document.querySelector("#message");
            message.innerHTML += `Erro: ${openRequest.error}`;
            return;
        };
    }

    fetchAllCountries() {
        let store = this.dbAction;
        
        let restCountriesURL = "https://restcountries.com/v3.1/all?fields=name,region,continents,population,latlng"
        let p = fetch(restCountriesURL, { method: 'GET' });
        
        let allCountries = new Array();

        p.then(response => response.json()).then(function (countries) {
            countries.sort((c) => c.name.common);
            countries.map((c) => {
                let country = new Country(c.name.common, c.region,
                                          c.continents[0], c.population,
                                          c.latlng[0], c.latlng[1]);

                allCountries.push(country);
            });

            store(allCountries, DB_Actions.POPULATE);
        });
    }
   
    setAllCountries() {
        let openRequest = indexedDB.open("countries", 1);
        openRequest.onupgradeneeded = function () {
            let db = openRequest.result;
            console.log(event.oldVersion);
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
            let transaction = db.transaction("countries", "readonly");
            let request = transaction.objectStore("countries");
            request = request.getAll();
            
            request.onsuccess = function () {
                let datalist = document.querySelector("datalist");
                request.result.map(c => {
                    let option = document.createElement("option");
                    option.value = c.name;
                    datalist.appendChild(option);
                });
            }

            return true;
        }

        openRequest.onerror = function () {
            let message = document.querySelector("#message");
            message.innerHTML += `Erro: ${openRequest.error}`;
            return false;
        };
    }

    play(event) {
        let listInput = document.querySelector("#selected-country");
        let country = listInput.value;
        listInput.value = "";

        if(!country.trim().length) console.error("País vazio");
        country = this.dbAction(country, DB_Actions.GET);
    }

    init() {
        if(!this.dbAction(null, DB_Actions.GET_ALL)) {
            this.fetchAllCountries();
            this.dbAction(null, DB_Actions.GET_ALL);
        }
        
        //if(!this.setAllCountries()) {
        //    this.fetchAllCountries();
        //}
    
        let inputList = document.querySelector("#selected-country");
        let button = document.querySelector("button");

        inputList.addEventListener("keydown", (event) => {
            if(event.code == "Enter"){
                event.preventDefault();
                this.play.bind(this);
            }

            inputList.innerHTML = "";
        });

        button.onclick = this.play.bind(this);
        this.setAllCountries.bind(this);
        //console.log(this.allCountries);
    }

}

let gui = new GUI();
gui.init();