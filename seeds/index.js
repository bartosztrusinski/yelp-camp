const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const {places, descriptors} = require('./seedHelpers')

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

const sample = array => array[Math.floor(Math.random() * array.length)]

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '60393dfbcd4af10210b59fa6',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            price,
            geometry: {
                type: 'Point',
                coordinates: [cities[random1000].longitude, cities[random1000].latitude]
            },
            description: 'Lee parley pillage ye furl bilged on her anchor aft clap of thunder lookout provost. Ballast hardtack trysail gun pirate bounty fire ship hornswaggle Davy Jones\' Locker jolly boat. Reef sails maroon lookout case shot rope\'s end Sail ho interloper lee port hail-shot.\n' +
                '\n' +
                'Holystone pressgang cutlass barque haul wind deadlights line Pirate Round fire in the hole walk the plank. Pillage scurvy parley to go on account Sea Legs aye sloop Pirate Round draft mutiny. Galleon square-rigged boatswain reef six pounders hulk hearties lookout schooner transom.\n' +
                '\n' +
                'Log prow nipperkin spanker Yellow Jack walk the plank list interloper cutlass hempen halter. Davy Jones\' Locker main sheet sloop smartly skysail six pounders snow jack hempen halter loaded to the gunwalls. Mizzenmast hulk quarter chase guns trysail avast long clothes squiffy grog dance the hempen jig.',

            images: [
                {
                    url: 'https://res.cloudinary.com/bartoszt/image/upload/v1614610806/YelpCamp/bnybiulgjcrxyfufdony.jpg',
                    filename: 'YelpCamp/bnybiulgjcrxyfufdony'
                },
                {
                    url: 'https://res.cloudinary.com/bartoszt/image/upload/v1614610806/YelpCamp/n02xhrbwnpbphkvdgz3b.jpg',
                    filename: 'YelpCamp/n02xhrbwnpbphkvdgz3b'
                }
            ]
        });
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})