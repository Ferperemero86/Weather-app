const path = require('path');
const express = require('express');
const ForecastIo = require('forecastio');
const parser = require('body-parser');
const cityCoords = require('city-to-coords');

//Set a enviroment variable
const port  = process.env.PORT || 3000;
const app = express();
const weather = new ForecastIo('29ee716c4106fd41c688faf9d89e9be8'); 

app.set('view engine', 'ejs');
app.set(path.resolve(__dirname + '/views'));

//Global array to store results from Post
let entries = [];
app.locals.entries = entries;

//Set the public directory to static files and use body-parser middleware
app.use(express.static(path.resolve(__dirname + '/public')));
app.use(parser.urlencoded({ extended: true }));

//Render index page
app.get('/',(req, res) => {
  res.render('index');
});

//Take  data from Post and bodyparser
app.post('/',(req, res) => {
  const cityPost = req.body.postCode;
  
  //Use body-parser stored data and get latitude and longitude
  cityCoords(cityPost)
    .then((coords) => {
      const lat = coords.lat;
      const lng = coords.lng;
     
      //Use long and lat to get all the weather info
      weather.forecast(lat, lng, (err, data) => {
        const tempRes = function toCelsius(f) {
        return (5/9) * (f-32);
        }  

        //Convert temperature in celsius and store in the global array
        const celsius = Math.floor(tempRes(data.currently.temperature));   
          entries.unshift({
            temperature: celsius,
            summary: data.currently.summary,
            precipProbability: data.currently.precipProbability,
            humidity: data.currently.humidity
          });
          
          //Render index with all the weather info as parameters
          res.render('index.ejs',{
            sum: entries[0].summary,
            temp: entries[0].temperature,
            precip: entries[0].precipProbability,
            humidity: entries[0].humidity
          });        
        });

    //Send a error message if forecast doesn't find any result   
    }).catch(() => {
      res.render('index.ejs', {
        error: 'Please enter a valid city or try again'
      });
    })     
});

//Render 404 page if the site's route doesn't exist
app.use(function(req, res) {
  res.status(404).render("404");
});

app.listen(port);
