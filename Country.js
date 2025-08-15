export default class Country {
    constructor(name, hemisphere, continent, population, lat, long) {
        this.name = name;
        this.hemisphere = (lat > 0) ? "North" : "South";
        this.continent = continent;
        this.population = population;
        this.lat = lat;
        this.long = long;
    }

    distanceTo(country) {
        return this.long;
    }

    toHTML() {
        let message = document.querySelector("#message");
        message.innerHTML = this.name;
    }
}

//  hemisfério, continente, população e coordenadas.