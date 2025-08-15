export default class Country {
    constructor(name, hemisphere, continent, population, lat, long) {
        this.name = name;
        this.hemisphere = hemisphere;
        this.continent = continent;
        this.population = population;
        this.lat = lat;
        this.long = long;
    }

    distanceTo(country) {
        return this.long;
    }
}

//  hemisfério, continente, população e coordenadas.