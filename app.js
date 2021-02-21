const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Welcome from YelpCamp')
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})