const paginate = document.querySelector('#paginate');
const campgroundsContainer = document.querySelector('#campgrounds-container');
const endOfData = document.querySelector('#end-of-data');

if (paginate) {
  paginate.addEventListener('click', async function (e) {
    e.preventDefault();

    const pageData = await requestNextPage(this.href);
    generatePage(pageData);
    this.href = this.href.replace(/page=\d+/, `page=${pageData.nextPage}`);
    handleEndOfData(pageData);
  });
}

const requestNextPage = async function (url) {
  const response = await fetch(url);

  if (!response.ok) {
    const message = `An error has occured: ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  return data;
};

const generatePage = function (data) {
  for (let doc of data.docs) {
    let template = generateDocTemplate(doc);
    campgroundsContainer.insertAdjacentHTML('beforeend', template);
  }
};

const generateDocTemplate = function (campground) {
  const imageUrl = campground.images.length
    ? campground.images[0].square
    : 'https://res.cloudinary.com/bartoszt/image/upload/q_100,w_600,ar_1:1,c_fill,g_center,x_0,y_0/v1615231919/yelp_camp.png';

  return `<section>
            <div class="card mx-3 mx-sm-0">
              <img
                src="${imageUrl}"
                alt="${campground.title}'s picture"
                class="card-img-top campground-image"
              />
              <div class="card-body">
                <h2 class="card-title fs-5 text-truncate">${campground.title}</h2>
                <p class="card-text campground-description">${campground.description}</p>
                <div class="text-muted text-truncate small">${campground.location}</div>
              </div>
              <a
                href="/campgrounds/${campground._id}"
                class="btn btn-primary rounded-0 rounded-bottom stretched-link text-truncate py-2"
                >View ${campground.title}</a
              >
            </div>
          </section>`;
};

const handleEndOfData = function (data) {
  if (!data.hasNextPage) {
    paginate.remove();
    endOfData.classList.remove('d-none');
  }
};
