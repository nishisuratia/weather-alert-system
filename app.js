require("dotenv").config();

var express = require("express");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
var nodeMailer = require("nodemailer");
let alert = require("alert");

const axios = require("axios");
const CronJob = require("cron").CronJob;
const OPEN_WEATHER_KEY = process.env.OPEN_WEATHER_KEY;

(path = require("path")), (app = express());
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const mongoose = require("mongoose");
const { getMaxListeners } = require("process");
let otp = 0000;
let emailId = "";

app.engine(".hbs", exphbs.engine({ extname: ".hbs", defaultLayout: "main" }));

app.set("view engine", "handlebars");

app.use("/public", express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//app.use(express.static("public"));

mongoose.connect(process.env.URL, { useNewUrlParser: true });

const weatherSchema = {
    email: String,
    name: String,
    location: String,
    days: [String],
};

const Weather = mongoose.model("Weather", weatherSchema);

const cronJob = new CronJob("3 16 * * *", run);
cronJob.start();

async function run() {
    try {
        await Weather.find(function (err, weather) {
            if (err) {
                console.log(err);
            } else {
                console.log(weather);
                let weatherData1;
                let weatherData2;

                weather.forEach(function (weatherItem) {
                    const mailId = weatherItem.email;
                    const userName = weatherItem.name;
                    const userLocation = weatherItem.location;
                    const day = weatherItem.days;
                    console.log(mailId);

                    const weatherData = getWeatherData(userLocation);
                    const forecastInfo1 = getforecastData(userLocation, 0);
                    const forecastInfo2 = getforecastData(userLocation, 1);

                    const date = new Date();
                    let d = date.getDay();
                    const yyyy = date.getFullYear();

                    let mm = date.getMonth() + 1;
                    let dd = date.getDate();
                    if (dd < 10) dd = "0" + dd;
                    if (mm < 10) mm = "0" + mm;
                    const fullDate = dd + "/" + mm + "/" + yyyy;

                    let today;
                    if (d == 0) today = "Sunday";
                    else if (d == 1) today = "Monday";
                    else if (d == 2) today = "Tuesday";
                    else if (d == 3) today = "Wednesday";
                    else if (d == 4) today = "Thursday";
                    else if (d == 5) today = "Friday";
                    else today = "Saturday";

                    if (!day.includes(today)) {
                        forecastInfo1.then(function (result) {
                            weatherData1 = result;
                            forecastInfo2.then(function (result) {
                                weatherData2 = result;
                                console.log(weatherData1);
                                console.log(weatherData2);
                                console.log(userName);
                                let transporter = nodeMailer.createTransport({
                                    host: "smtp.gmail.com",
                                    port: 465,
                                    secure: true,
                                    auth: {
                                        user: "dummyforproject19@gmail.com",
                                        pass: "*******",
                                    },
                                });

                                let mailOptions = {
                                    from: '"Weather Alerts" <nishisuratia9102@gmail.com>', // sender address
                                    to: mailId, // list of receivers
                                    subject: "Weather Alert", // Subject line
                                    text: "Weather Alert for you", // plain text body
                                    html: `<p>Hello_${userName}, your weather alert for _today (${fullDate}) is here!</p>
                                <p>Maximum Temperature: ${
                                    weatherData1.temp_max
                                }°C</p>
                                <p>Minimum Temperature: ${
                                    weatherData1.temp_min
                                }°C</p>
                                <p>Temperature: ${weatherData1.tempf}°C</p>
                                <p>Weather Looks like: ${
                                    weatherData1.weather_main
                                }</p>
                                <p>Wind Speed: ${
                                    weatherData1.speed * 3.6
                                } km/hr </p>
                                ${
                                    weatherData1.weather_main == "Rain"
                                        ? `<p>It's ${weatherData1.weather_des} out there, please carry an umbrella with you and be safe!
                                </p>`
                                        : `<p>It's ${weatherData1.weather_des} out there</p>`
                                }
                                
                                <br>
                                <p>Your weather alert for _tommorow is here!</p>
                                <p>Maximum Temperature: ${
                                    weatherData2.temp_max
                                }°C</p>
                                <p>Minimum Temperature: ${
                                    weatherData2.temp_min
                                }°C</p>
                                <p>Temperature: ${weatherData2.tempf}°C</p>
                                <p>Weather Looks like: ${
                                    weatherData2.weather_main
                                }</p>
                                <p>Wind Speed: ${
                                    weatherData2.speed * 3.6
                                } km/hr</p>
                                ${
                                    weatherData2.weather_main == "Rain"
                                        ? `<p>It's ${weatherData2.weather_des} out there, please carry an umbrella with you and be safe!
                                </p>`
                                        : `<p>It's ${weatherData2.weather_des} out there</p>`
                                }
                                <br>
                                <p>Thank you for subscribing with us!</p>`,
                                };

                                transporter.sendMail(
                                    mailOptions,
                                    (error, info) => {
                                        if (error) {
                                            return console.log(error);
                                        }
                                        console.log("Message sent");
                                    }
                                );
                            });
                        });
                    }
                });
            }
        });
    } catch (e) {
        console.log(e);
    }
}
function getWeatherData(city) {
    return axios
        .get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPEN_WEATHER_KEY}&units=metric`
        )
        .then((result) => {
            return {
                weather_id: result.data.weather[0].id + "",
                temp: result.data.main.temp,
                weather_main: result.data.weather[0].main,
            };
        });
}
function getforecastData(city, k) {
    return axios
        .get(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPEN_WEATHER_KEY}&units=metric`
        )
        .then((result) => {
            return {
                date: result.data.list[k].dt_txt,
                tempf: result.data.list[k].main.temp,
                weather_main: result.data.list[k].weather[0].main,
                weather_des: result.data.list[k].weather[0].description,
                speed: result.data.list[k].wind.speed,
                temp_min: result.data.list[k].main.temp_min,
                temp_max: result.data.list[k].main.temp_max,
            };
        });
}

// run()

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/firstindex.html");
});

app.get("/subscribe", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.get("/success", function (req, res) {
    res.sendFile(__dirname + "/success.html");
});

app.get("/unsubscribe", function (req, res) {
    res.sendFile(__dirname + "/unsubscribe.html");
});
app.get("/unsubscribed", function (req, res) {
    res.sendFile(__dirname + "/unsubmsg.html");
});
app.get("/verify", function (req, res) {
    res.sendFile(__dirname + "/subscribe.html");
});
app.get("/change", function (req, res) {
    res.sendFile(__dirname + "/update.html");
});

app.post("/update", function (req, res) {
    const emailId = req.body.email;
    const userName = req.body.name;
    const userLocation = req.body.location;
    const day1 = req.body.monday;
    const day2 = req.body.tuesday;
    const day3 = req.body.wednesday;
    const day4 = req.body.thrusday;
    const day5 = req.body.friday;
    const day6 = req.body.saturday;
    const day7 = req.body.sunday;

    const day = [];
    if (day1) day.push("Monday");
    if (day2) day.push("Tuesday");
    if (day3) day.push("Wednesday");
    if (day4) day.push("Thrusday");
    if (day5) day.push("Friday");
    if (day6) day.push("Saturday");
    if (day7) day.push("Sunday");

    Weather.updateMany(
        { email: emailId },
        { name: userName, location: userLocation, days: day },
        function (err) {
            if (err) {
                console.log(err);
                alert("Your entered Email doesn't exist in our database");
            } else {
                console.log("Data updated successfully");
                res.redirect("/success");
            }
        }
    );
});

app.post("/delete", function (req, res) {
    const emailId = req.body.email;
    Weather.deleteMany({ email: emailId }, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Successfully Deleted");
        }
    });
    res.redirect("/unsubscribed");
});

app.post("/sendEmail", function (req, res) {
    emailId = req.body.email;

    let transporter = nodeMailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: "dummyforproject19@gmail.com",
            pass: "ilrqkumtuvokdhba",
        },
    });
    otp = Math.floor(1000 + Math.random() * 9000);

    let mailOptions = {
        from: '"Nishi Suratia" <nishisuratia9102@gmail.com>', // sender address
        to: emailId, // list of receivers
        subject: "OTP Verification", // Subject line
        text: "Thank you for subscribing", // plain text body
        html: `<b>Your OTP is:${otp}</b>.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log("Message %s sent: %s", info.messageId, info.response);
        res.redirect("/verify");
    });
});

app.post("/send", function (req, res) {
    const output = `
    <p> you have new subscription request</p>
    <h3>details</h3>
    <ul>
     <li>Name: ${req.body.name}</li>
     <li>email: ${emailId}</li>
     <li>location: ${req.body.location}</li>
     
    </ul>
    <h3>Message</h3>
    <p>${req.body.message}</p>

    `;

    const userName = req.body.name;
    const userLocation = req.body.location;
    const day1 = req.body.monday;
    const day2 = req.body.tuesday;
    const day3 = req.body.wednesday;
    const day4 = req.body.thrusday;
    const day5 = req.body.friday;
    const day6 = req.body.saturday;
    const day7 = req.body.sunday;

    const day = [];
    if (day1) day.push("Monday");
    if (day2) day.push("Tuesday");
    if (day3) day.push("Wednesday");
    if (day4) day.push("Thrusday");
    if (day5) day.push("Friday");
    if (day6) day.push("Saturday");
    if (day7) day.push("Sunday");

    const OTP = req.body.otp;
    const weather = new Weather({
        email: emailId,
        name: userName,
        location: userLocation,
        days: day,
    });

    if (OTP == otp) {
        weather.save();
        res.redirect("/success");
    } else {
        alert("Your entered OTP is wrong, Please Check and Enter correct OTP");
        console.log("Incorrect OTP");
    }
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server is started on port 3000");
});
