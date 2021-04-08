const paginate = document.querySelector('#paginate')
    , $campgroundsContainer = $('#campgrounds-container')
    , endOfData = document.querySelector('#end-of-data');

if(paginate) {
    paginate.addEventListener('click', async function(e) {
        e.preventDefault();
        const pageData = await requestNextPage(this.href);
        generatePage(pageData);
        this.href = this.href.replace(/page=\d+/, `page=${pageData.nextPage}`);
        handleEndOfData(pageData);
    });
}

const requestNextPage = async function(url) {
    const response = await fetch(url);
    if(!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
    }
    const data = await response.json();
    return data;
}

const generatePage = function(data) {
    for(let doc of data.docs) {
        let template = generateDocTemplate(doc);
        $campgroundsContainer.append(template);
    }
}

const generateDocTemplate = function(campground) {
    return `<article class="card mb-3 mx-3 mx-md-0">
               <div class="row g-0">
                   <div class="col-md-4 col-lg-3">
                           <img src="${campground.images.length ? campground.images[0].square : 'https://res.cloudinary.com/bartoszt/image/upload/q_100,w_600,ar_1:1,c_fill,g_center,x_0,y_0/v1615231919/yelp_camp.png'}" alt="" class="img-fluid">
                   </div>
                   <div class="col-md-8 col-lg-9">
                       <div class="card-body text-md-start text-center p-4">
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
           </article>`;
}

const handleEndOfData = function(data) {
    if(!data.hasNextPage) {
        paginate.remove();
        endOfData.classList.remove('d-none');
    }
}