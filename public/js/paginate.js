const paginate = document.querySelector('#paginate');
const $campgroundsContainer = $('#campgrounds-container');
const endOfData = document.querySelector('#end-of-data');

paginate.addEventListener('click', function (e) {
    e.preventDefault();
    fetch(this.href)
        .then(response => response.json())
        .then(data => {
            for (let campground of data.docs) {
                let template = generateTemplate(campground);
                $campgroundsContainer.append(template);
            }
            const {nextPage} = data;
            this.href = this.href.replace(/page=\d+/, `page=${nextPage}`)
            if (!data.hasNextPage) {
                this.remove();
                endOfData.classList.remove('d-none');
            }
        })
        .catch(e => console.log(e))
})

const generateTemplate = function (campground) {
    return `<article class="card mb-3 mx-3 mx-md-0">
               <div class="row g-0">
                   <div class="col-md-5 col-lg-4">
                           <img src="${campground.images.length ? campground.images[0].square : 'https://res.cloudinary.com/bartoszt/image/upload/q_100,w_600,ar_1:1,c_fill,g_center,x_0,y_0/v1615231919/yelp_camp.png'}" alt="" class="img-fluid">
                   </div>
                   <div class="col-md-7 col-lg-8">
                       <div class="card-body">
                           <h5 class="card-title display-4 fs-3">${campground.title}</h5>
                           <p class="card-text">${campground.description.substr(0, 200)}...</p>
                           <p class="card-text">
                               <small class="text-muted">${campground.location}</small>
                           </p>
                           <a href="/campgrounds/${campground._id}"
                              class="btn btn-primary">View ${campground.title}</a>
                       </div>
                   </div>
               </div>
           </article>`
}
