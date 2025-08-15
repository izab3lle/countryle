import Country from "./Country.js";

class GUI {
    constructor() {
        this.attempts = 0;
        this.country = null;
        this.hasCountryList = false;
        this.allCountries = new Array();
    }

    storeCountries(allCountries) {
        let openRequest = indexedDB.open("countries", 1);
        openRequest.onupgradeneeded = function (ev) {
            switch (ev.oldVersion) {
                case 0:
                    db.createObjectStore("countries", {keyPath: 'name'});
                case 1:

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
                    message.innerHTML += `Erro: ${request.error}`;
                };
            })
        }
        
        openRequest.onerror = function () {
            let message = document.querySelector("#message");
            message.innerHTML += `Erro: ${openRequest.error}`;
        };
    }

    fetchAllCountries(allCountries) {
        if(this.hasCountryList) return;
        
        let restCountriesURL = "https://restcountries.com/v3.1/all?fields=name,region,continents,population,latlng"
        let p = fetch(restCountriesURL, { method: 'GET' });
        let datalist = document.querySelector("datalist");
        //let allCountries = new Array();

        p.then(response => response.json()).then(function (countries) {
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

            this.storeCountries(allCountries);
        });

        this.hasCountryList = true;

    }

    getAllCountries() {
        fetch(this.allCountries);
    }

    play(event) {
        let listInput = document.querySelector("#selected-country");
        let country = listInput.value;
        listInput.value = "";

        if(!country.trim().length) console.error("País vazio");
        console.log(country);
    }

    init() {
        this.fetchAllCountries(this.allCountries);

        let inputList = document.querySelector("#selected-country");
        let button = document.querySelector("button");

        inputList.addEventListener("keydown", (event) => {
            if(event.code == "Enter"){
                event.preventDefault();
                this.play.bind(this);
            }
        });

        button.onclick = this.play.bind(this);
    }

}

let gui = new GUI();
gui.init();