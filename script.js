$(function(){

    let sidebarData = {
        //predefined start cities
        previousCity : ["Fairfield","Concord", "San Jose", "Tahoe", "South San Francisco", "San Francisco", "Vacaville", "Los Angeles", "Portland"],
        lastSearchedCity : "San Francisco",
    }

    const weatherSaved ="weather-key"
    const apiKey = "5376026037abf2f47d429c1207e6b9a5";

    start();

    function start() {
        let savedWeather = localStorage.getItem(weatherSaved);

        if (savedWeather) {
            sidebarData = JSON.parse(savedWeather);
        }

        populatePreviousCity ();
        fetchCityWeather(sidebarData.lastSearchedCity);

        $("#button-search").on("click", function(event) {

            let inputCity = $("#city").val();


            fetchCityWeather(inputCity);
        });
    }
    //adds predefined sidebar cities
    function populatePreviousCity () {

        let  previousCityList = $("#previous-city");
        $(previousCityList).empty();

        for (let i = 0; i < sidebarData. previousCity.length; i ++) {
            let liElement = $("<li>");
            $(liElement).addClass("list-group-item");

            if(sidebarData. previousCity[i] === sidebarData.lastSearchedCity)
                $(liElement).addClass("active");

            $(liElement).text(sidebarData. previousCity[i]);
            $(previousCityList).append(liElement);
        }

        $(".list-group-item").on("click", function(event) {
            let cityName = $(this).text();

            fetchCityWeather(cityName);
        });
    }

    function fetchCityWeather(cityName) {
        
        let parsedCityName = encodeURIComponent(cityName);
        let queryURL = `https://api.openweathermap.org/data/2.5/weather?q=${parsedCityName}&appid=${apiKey}`;

        $.ajax({
            url : queryURL,
            method : "GET"
        }).then(function(response){

            if(sidebarData. previousCity.indexOf(cityName) < 0) {
                //adds and removes cities from sidebar
                $("#previous-city").empty();
                sidebarData.previousCity.pop();
                sidebarData.previousCity.splice(0, 0, cityName);
            }
 
            sidebarData.lastSearchedCity = cityName;

            localStorage.setItem(weatherSaved, JSON.stringify(sidebarData));

            populatePreviousCity ();
            //adds today's date to main city
            let date = new Date();
            $("#city-name").text(`${response.name} (${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()})`);
            let icon = $(`<img src="https://openweathermap.org/img/wn/${response.weather[0].icon}@2x.png", alt="city-icon" class="city-icon"/>`);
            $("#city-name").append(icon);
            //convert to fahrenheit
            let celsius = response.main.temp;
            let fahrenheit = (celsius - 273.15) * 9/5 + 32;

            $("#temp").html(`Temperature: ${fahrenheit.toFixed(0)} &deg;F`);
            $("#humd").html(`Humidity: ${response.main.humidity}%`);
            $("#wind").html(`Wind Speed: ${response.wind.speed} MPH`);

            fetchUVIndex(response.coord.lat, response.coord.lon);

            fetchCity5DayForecast(cityName);
        })
        //uv-index api
        function fetchUVIndex(lat, lon){
            let queryURL = `https://api.openweathermap.org/data/2.5/uvi?appid=${apiKey}&lat=${lat}&lon=${lon}`;

            $.ajax({
                url: queryURL,
                method: "GET"
            }).then(function(response){
                
                let uvIndex = response.value;
                let color = "uv-low";
                //identifies uv-index levels
                if(uvIndex >= 0 && uvIndex <= 3)
                    color ="uv-low";
                else if(uvIndex > 3 && uvIndex <= 5)
                    color = "vs-fair";
                else if(uvIndex > 5 && uvIndex <= 7)
                    color = "uv-moderate";
                else if(uvIndex > 7 && uvIndex <=10)
                    color = "uv-moderate-high";
                else 
                    color = "uv-severe";

                $("#uvindex").html(`UV Index: <button class="btn ${color}">${uvIndex}</button>`);
            });
        }
        //5-day forecast api
        function fetchCity5DayForecast(cityName) {

            let queryURL = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}`;

            $.ajax({
                url : queryURL,
                method : "GET"
            }).then(function(response){
                let fiveDays = [];
                //loops through 5 days
                for (let i = 0; i < response.list.length && i < response.list.length; i +=8)
                    fiveDays.push(response.list[i]);

                let cityForecast = $(".day-forecast");
                $(cityForecast).empty();

                for (let i = 0; i < fiveDays.length; i++)
                {
                    let dayDate = new Date(fiveDays[i].dt_txt);
                    let dayCard = $("<div>");
                    $(dayCard).addClass("card fluid bg-primary city-forecast-day");
                    let dayBody = $("<div>");
                    $(dayBody).addClass("card-body forecast-body");

                    let forecastDate = $("<h4>");

                    $(forecastDate).html(`${(dayDate.getMonth() + 1)}/${dayDate.getDate()}/${dayDate.getFullYear()}`);
                    //adds image to 5-day card
                    let imgIcon = $("<img>");
                    $(imgIcon).addClass("forecast-icon");
                    $(imgIcon).attr("src", `https://openweathermap.org/img/wn/${fiveDays[i].weather[0].icon}@2x.png`);
                    $(imgIcon).attr("alt", `city-forecast-icon-${(i + 1)}`);
                   
                   //adds wind speed to 5-day card
                   let dayWindSp = $("<div>");
                   $(dayWindSp).html(`Wind Speed: ${fiveDays[i].wind.speed} MPH`);

                    //adds temp to 5-day card
                    let dayTemp = $("<div>");
                    //convert to fahrenheit
                    let celsius = fiveDays[i].main.temp;
                    let fahrenheit = (celsius - 273.15) * 9/5 + 32;

                    $(dayTemp).addClass("day-item");
                    $(dayTemp).html(`Temp: ${fahrenheit.toFixed(0)} &deg;F`);
                    //adds humidity to 5-day card
                    let dayHumd = $("<div>");

                    $(dayHumd).html(`Humidity: ${fiveDays[i].main.humidity}%`);
                    //add data to city body card
                    $(dayBody).append(forecastDate, imgIcon, dayTemp, dayHumd, dayWindSp);

                    $(dayCard).append(dayBody);

                    $(cityForecast).append(dayCard);
                }
            });
        }
    }

})