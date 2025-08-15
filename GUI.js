import Country from "./Country.js";

class GUI {
    constructor() {
        this.attempts = 0;
        this.country = null;
        this.hasCountryList = false;
        this.allCountries = new Array();
    }

    compare(country) {
        console.log(country);
        let attempts = document.querySelector("#attempts");
        let li = document.createElement("li");
        country.toHTML();
        for(let key in country) {
            li.innerHTML +=`<p>${key}: ${country[key]}</p>`
        }
        attempts.appendChild(li);
        this.attempts++;
    }

    storeCountries(allCountries) {
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

    fetchAllCountries() {
        let store = this.storeCountries;
        
        let restCountriesURL = "https://restcountries.com/v3.1/all?fields=name,region,continents,population,latlng"
        let p = fetch(restCountriesURL, { method: 'GET' });
        let datalist = document.querySelector("datalist");
        console.log(datalist);
        let allCountries = new Array();

        p.then(response => response.json()).then(function (countries) {
            countries.sort((c) => c.name.common);
            countries.map((c) => {
                let country = new Country(c.name.common,
                                          c.region,
                                          c.continents[0],
                                          c.population,
                                          c.latlng[0], c.latlng[1]);

                allCountries.push(country);

                let option = document.createElement("option");
                option.value = country.name;
                datalist.appendChild(option);
            });
            console.log("antes do store");

            store(allCountries);
        });
    }

    fetchCountry(name) {
        let openRequest = indexedDB.open("countries", 1);

        let compare = this.compare;
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
                request.result.map(c => this.allCountries.push(c));
            }
        }

        openRequest.onerror = function () {
            let message = document.querySelector("#message");
            message.innerHTML += `Erro: ${openRequest.error}`;
            return;
        };
    }

    play(event) {
        let listInput = document.querySelector("#selected-country");
        let country = listInput.value;
        listInput.value = "";

        if(!country.trim().length) console.error("País vazio");
        country = this.fetchCountry(country);

        if(country == undefined) {
            let message = document.querySelector("#message");
            message.innerHTML = country;
        }
    }

    init() {
        this.fetchAllCountries();
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