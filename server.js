const express = require('express')
const fs = require("fs")
const bodyParser = require('body-parser')
const forecastJson = require("./forecastdata.json")

var app = express()
const port = process.env.PORT || 8081

var palette = [];
palette.push(
	"#3CC678",
	"#69C763",
	"#95C74D",
	"#C2C637",
	"#EEC622",
	"#F2B118",
	"#F59B0C",
	"#F87E00",
	"#F85D06",
	"#F83C0D",
	"#F80F16"
)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())

app.get('', function (req, res) {
	fs.readFile(__dirname + "/" + "main_page.json", 'utf8', function (err, data) {
		if (err) {
			console.log("Error reading file from disk: ", err)
			return
		}
		try {
			res.end(data)
		} catch (err) {
			console.log('Error parsing JSON string: ', err)
		}
	});
})

app.get('/parking/:time/:day', function (req, res) {
	fs.readFile(__dirname + "/" + "main_page.json", 'utf8', function (err, data) {
		if (err) {
			console.log("Error reading file from disk: ", err)
			return
		}
		var page = JSON.parse(data)
		var time = parseTime(req.params.time.replace(':', ''))
		var svg = recolorSVG(time, parseDay(req.params.day))
		page.content[6].content[0].groundOverlayImages = [
			{
				url: "data:image/svg+xml;base64,"+(new Buffer.from(svg).toString('base64')),
				boundingBox: [
					-119.7539,
					36.80875,
					-119.73440519169783,
					36.81799
				]
			}
		]
		try {
			res.end(JSON.stringify(page))
		} catch (err) {
			console.log('Error parsing JSON string: ', err)
		}
	});
})

app.post('/date', function (req, res) {
	if (req.body) {
		console.log("POST request for /date")

		var response = {
			"metadata": {
				"version": "2.0",
				"redirectLink": {
					"relativePath": "/parking/" + req.body.time + "/" + req.body.day
				}
			}
		}
		res.end(JSON.stringify(response))
	}
})

var server = app.listen(port, function () {
	console.log("Middleware listening at port %s", port)
})

function parseTime(time) {
	var result = "0000";
	var front = parseInt(time.slice(0,2))
	var back = parseInt(time.slice(2,4))

	if(back < 30) {
		if(front < 10) {
			result = "0" + front.toString() + "00"
		} else {
			result = front.toString() + "00"
		}
	} else {
		if(front+1 < 10) {
			result = "0" + (front+1).toString() + "00"
		} else if(front+1 <= 24) {
			result = (front+1).toString() + "00"
		}
	}
	
	return result
}

function parseDay(day) {
	if(!(day in forecastJson)) {
		return "mon"
	} else {
		return day
	}
}

function recolorSVG(time, day) {
	var file = fs.readFileSync(__dirname + "/" + "lot.svg", 'utf8')
	if (!file) {
		console.log("Error reading file from disk")
		return ""
	} else {
		let timeData = forecastJson[day][time];
		let keys = Object.keys(timeData);
		for (let i in keys) {
			let target = '#' + keys[i] + "#";
			let fullness = timeData[keys[i]];
			let hue = palette[Math.floor(fullness * 10)];
			file = file.replaceAll(target, hue)
		}
		return file
	}
}