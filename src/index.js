import './css/styles.css';
import PhotoApiService from './photo-service';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import throttle from 'lodash.throttle';

const photosApiService = new PhotoApiService();

const refs = {
  searchForm: document.querySelector('#search-form'),
  gallery: document.querySelector('.gallery'),
};

const lightbox = new SimpleLightbox('.gallery a', {
  scrollZoom: false,
});

refs.searchForm.addEventListener('submit', onSearch);

async function onSearch(e) {
  e.preventDefault();

  if (
    photosApiService.query ===
      e.currentTarget.elements.searchQuery.value.trim() &&
    !photosApiService.query
  ) {
    Notify.failure('Sorry, but you must enter a value');
    return;
  }

  if (
    photosApiService.query === e.currentTarget.elements.searchQuery.value.trim()
  ) {
    return;
  }

  clearPhotosContainer();

  photosApiService.query = e.currentTarget.elements.searchQuery.value.trim();

  if (!photosApiService.query) {
    Notify.failure('Sorry, but you must enter a value');

    return;
  }

  photosApiService.resetPage();
  photosApiService.resetTotalLoadedPhoto();
  photosApiService.resettotalHits();
  photosApiService.isAllLoaded = false;

  try {
    const photosResponse = await photosApiService.fetchPhotos();
    const photoArray = photosResponse.hits;

    if (photoArray.length === 0) {
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }

    Notify.success(`Hooray! We found ${photosResponse.totalHits} images.`);

    renderPhotos(photoArray);

    if (photosApiService.totalLoadedPhoto >= photosApiService.totalHits) {
      Notify.failure(
        "We're sorry, but you've reached the end of search results."
      );
      return;
    }
  } catch (err) {
    console.log(err);
  }
}

window.addEventListener(
  'scroll',
  throttle(() => {
    // console.log('scrollY:', window.scrollY); //scrolled from top
    // console.log('innerHeight:', window.innerHeight); //visible part of screen
    // console.log('scrollHeigth:', document.documentElement.scrollHeight);
    // console.log(
    //   document.documentElement.scrollHeight -
    //     (window.scrollY + window.innerHeight)
    // );

    if (
      document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight) <=
      400
      // window.scrollY + window.innerHeight >=
      // document.documentElement.scrollHeight
    ) {
      loadImages();
    }
  }, 400)
);

async function loadImages() {
  if (photosApiService.isAllLoaded === false)
    try {
      const photosResponse = await photosApiService.fetchPhotos();
      console.log('page: ', photosApiService.page);
      const photoArray = await photosResponse.hits;

      renderPhotos(photoArray);
    } catch (err) {
      console.log(err);
    }
  if (photosApiService.totalLoadedPhoto >= photosApiService.totalHits) {
    photosApiService.isAllLoaded = true;
    return;
  }
}

function renderPhotos(photos) {
  const template = photos
    .map(
      ({
        webformatURL,
        tags,
        likes,
        views,
        comments,
        downloads,
        largeImageURL,
      }) => `<div class="photo-card">
      <div class='thumb'>
      <a class="gallery__item link" href="${largeImageURL}">
      <img class="gallery__image" src="${webformatURL}" alt="${tags}" loading="lazy" />
      </a>
      </div>
      <div class="info">
        <p class="info-item">
          <b>Likes</b> <span>${likes}</span>
        </p>
        <p class="info-item">
          <b>Views</b> <span>${views}</span>
        </p>
        <p class="info-item">
          <b>Comments</b> <span>${comments}</span>
        </p>
        <p class="info-item">
          <b>Downloads</b> <span>${downloads}</span>
        </p>
      </div>
    </div>`
    )
    .join('');

  refs.gallery.insertAdjacentHTML('beforeEnd', template);
  lightbox.refresh();

  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

function clearPhotosContainer() {
  refs.gallery.innerHTML = '';
}
