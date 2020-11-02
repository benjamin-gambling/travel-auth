async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createGallery(container) {
  var _myGallery = cloudinary.galleryWidget({
    container: "#" + container.getAttribute("id"),
    cloudName: "dtgbbrxs0",
    carouselStyle: "none",
    aspectRatio: "16:9",
    mediaAssets: [
      {
        publicId: "robot5",
        mediaType: "image",
      },
    ],
    zoom: false,
    preload: ["image", "video"],
    placeholderImage: true,
    videoProps: {
      autoplay: false,
      controls: "play",
    },
    navigationButtonProps: {
      size: 30,
      shape: "round",
      iconColor: "#000",
      color: "#ffffff",
    },
  });
  await _myGallery.render();
  return _myGallery;
}

async function updateGallery(_myGallery, container) {
  var tags = container
    .getAttribute("data-tags")
    .split(";")
    .reduce((acc, curr) => {
      let [tag, mediaType = "image"] = curr.trim().split(":");
      acc.push({
        tag,
        mediaType,
      });
      return acc;
    }, []);

  await _myGallery.update({
    mediaAssets: tags,
  });
}

async function orderedShow() {
  let containers = document.querySelectorAll("[data-gallery='true']");
  var galleries = [];
  for (galleryContainer of containers) {
    if (!galleryContainer.getAttribute("data-loaded")) {
      try {
        galleries.push({
          gallery: await createGallery(galleryContainer),
          container: galleryContainer,
        });
      } catch (e) {}
    }
  }
  for (gallery of galleries) {
    await updateGallery(gallery.gallery, gallery.container);
    gallery.container.setAttribute("data-loaded", true);
  }
}

// ITIN SECTIONS
const itinSections = [...document.querySelectorAll('[class^="itin-section"]')];

itinSections.forEach((section) => (section.style.transition = "all 1s ease"));

// NEXT/PREVIOUS DAY BUTTONS
let itinNum = 0;

const next = document.getElementById("next-day");
const previous = document.getElementById("previous-day");
const buttons = [next, previous];

const showDisplay = (boolean) => {
  if (boolean) {
    itinSections[itinNum].style.display = "block";
    itinSections[itinNum].style.zIndex = 1;
    setTimeout(() => {
      itinSections[itinNum].style.opacity = 1;
    }, 1000);
  } else {
    itinSections[itinNum].style.display = "none";
    itinSections[itinNum].style.opacity = 0;
    itinSections[itinNum].style.zIndex = -1;
  }
};

const buttonDisplay = () => {
  if (itinNum === 0 && itinNum === itinSections.length - 1) {
    buttons.forEach((but) => (but.style.opacity = 0));
    return;
  } else if (itinNum === 0) {
    previous.style.opacity = 0;
    next.style.opacity = 1;
    return;
  } else if (itinNum === itinSections.length - 1) {
    next.style.opacity = 0;
    previous.style.opacity = 1;
    return;
  } else {
    buttons.forEach((but) => (but.style.opacity = 1));
    return;
  }
};

const toggleDay = () => {
  buttonDisplay();
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      showDisplay(false);
      button.id === "next-day"
        ? itinNum === itinSections.length - 1
          ? null
          : itinNum++
        : itinNum === 0
        ? null
        : itinNum--;
      showDisplay(true);
      buttonDisplay();
      if (button.id === "next-day" && itinNum < itinSections.length) {
        nextItinLoad();
      }
    });
  });
};

// // OBSERVER FUNCTION
// const observeItin = () => {
//   let delayExecution = false;
//   const config = {
//     attributes: true,
//   };
//   const callback = (mutationsList, observer) => {
//     for (const mutation of mutationsList) {
//       if (!mutation.target.getAttribute("data-loaded")) {
//         if (
//           mutation.target.style.display === "block" &&
//           delayExecution === false
//         ) {
//           delayExecution = true;
//           setTimeout(() => (delayExecution = false), 1500);
//           orderedShow();
//           mutation.target.setAttribute("data-loaded", true);
//         }
//       }
//     }
//   };
//   const observer = new MutationObserver(callback);

//   itinSections.forEach((node) => {
//     observer.observe(node, config);
//   });
// };

const nextItinLoad = () => {
  let nextItin = 0;
  itinSections[nextItin].style.zIndex = -1;
  itinSections[nextItin].style.display = "block";
  orderedShow();
  nextItin++;
};

const activateListeners = (() => {
  const selectExperienceButton = document.getElementById("select-experience");
  const selectExperienceButton2 = document.getElementById("select-experience2");

  selectExperienceButton.addEventListener("click", () => {
    nextItinLoad();
    toggleDay();
    selectExperienceButton2.addEventListener("click", () => {
      nextItinLoad();
      showDisplay(true);
    });
  });
})();

// observeItin();
