const express = require("express");
const app = express();
const axios = require("axios");
const cheerio = require("cheerio");
const db = require('./db');
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get("/all/", async function (req, res) {

    const result = await db.query(db.sql.selectAllQuery);
    res.send(result.rows)
});

app.get("/states/", async function (req, res) {

    const result = await db.query(db.sql.selectStateQuery);
    res.send(result.rows)
});

app.listen(port, function () {
    console.log("Your app is listening");
});


setTimeout(async () => {
    let response;
    try {
        response = await axios.get("https://www.mohfw.gov.in/");
        if (response.status !== 200) {
            console.log("ERROR");
        }
    } catch (err) {
        return null;
    }


    // get HTML and parse death rates
    const html = cheerio.load(response.data);

    const table = html("#cases > div > div > table > tbody").children("tr").toArray();

    for (let row of table) {
        let result = [];
        const cells = row.children.filter(i => i.type === "tag");
        if (cells.length === 5) {
            for (let j = 1; j < cells.length; j++) {
                //state name
                if (j === 1) {
                    result.push(cells[j].children[0].data);
                }
                // total_case
                if (j === 2) {
                    result.push(parseInt(cells[j].children[0].data));
                }
                // recovered
                if (j === 3) {
                    result.push(parseInt(cells[j].children[0].data));
                }
                //death
                if (j === 4) {
                    result.push(parseInt(cells[j].children[0].data));
                }

            }
            try {
                let rowCount = await db.query(db.sql.ifExistQuery, [result[0]]);
                if (rowCount.rows[0] !== undefined && parseInt(rowCount.rows[0].exists) > 0)

                    await db.query(db.sql.updateQuery, result);
                else

                    await db.query(db.sql.insertQuery, result);

            } catch (err) {
                console.log(err.stack)
            }
        }
    }

}, 2000);


