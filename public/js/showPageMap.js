mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v11',
    center: campground.geometry.coordinates,
    zoom: 10
});


map.addControl(new mapboxgl.NavigationControl());

const el = document.createElement('div');
el.className = 'marker';
el.style.backgroundImage = 'url(https://res.cloudinary.com/bartoszt/image/upload/w_40,h_40/v1615597373/camp_marker_3.png)';
el.style.width = '40px';
el.style.height = '40px';

new mapboxgl.Marker(el)
    .setLngLat(campground.geometry.coordinates)
    .setPopup(
        new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: true,
            closeOnMove: true,
            className: 'rounded-3 text-center'
        })
            .setHTML(
                `<strong class="text-success fs-6">${campground.title}</strong><p>${campground.location}</p>`
            )
    )
    .addTo(map)