const firebaseConfig = {
  apiKey: "AIzaSyBRZfDCC3YyZutj-lOnDxhq4n7u9AtOkCs",
  authDomain: "travel-895d5.firebaseapp.com",
  databaseURL: "https://travel-895d5.firebaseio.com",
  projectId: "travel-895d5",
  storageBucket: "travel-895d5.appspot.com",
  messagingSenderId: "74709196792",
  appId: "1:74709196792:web:d37d5c4069c2191b46c00d",
};
// FIREBASE INIT
firebase.initializeApp(firebaseConfig);
const Auth = firebase.auth();
const firebaseDiv = document.getElementById("firebase-auth");
// FACEBOOK INIT
const facebookInit = () => {
  window.fbAsyncInit = function () {
    FB.init({
      appId: "3482893361786244",
      cookie: true,
      xfbml: true,
      version: "v8.0",
    });

    FB.AppEvents.logPageView();
  };

  (function (d, s, id) {
    var js,
      fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
      return;
    }
    js = d.createElement(s);
    js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  })(document, "script", "facebook-jssdk");
};

// LOCAL STORAGE FUNCTIONS
const localStorageFunction = (() => {
  const getLocalUser = () => JSON.parse(localStorage.getItem("User"));
  const setLocalUser = () =>
    localStorage.setItem("User", JSON.stringify(localUser));

  const localUser = getLocalUser()
    ? getLocalUser()
    : {
        email: "",
        uid: "",
        photoURL: "",
        experiences: [],
      };

  const getLoggedInStatus = () => localStorage.getItem("LoggedIn");
  const setLoggedInStatus = (boolean) =>
    localStorage.setItem("LoggedIn", boolean);

  const setUser = (result) => {
    localUser.email = result.email;
    localUser.uid = result.uid;
    localUser.photoURL = result.photoURL;
    localUser.experiences = getExperience();
    setLocalUser();
  };

  const experiencePrevSelected = (tripID, expID) => {
    return localUser.experiences.findIndex(
      (x) => x.tripID === tripID && x.expID === expID
    );
  };

  const getExperience = () => localUser.experiences;

  const setExperience = (but) => {
    const tripID = but.getAttribute("data-tripid");
    const expID = but.getAttribute("data-experienceid");
    let tripObj = { tripID, expID };
    const expExists = experiencePrevSelected(tripID, expID);
    expExists === -1
      ? localUser.experiences.push(tripObj)
      : localUser.experiences.splice(expExists, 1);
    setLocalUser();
  };

  return {
    localUser,
    getLocalUser,
    getLoggedInStatus,
    setLoggedInStatus,
    setUser,
    experiencePrevSelected,
    setExperience,
  };
})();

// SIGN IN CREDENTIALS
const credentialAuth = (() => {
  const local = localStorageFunction.localUser;
  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");

  let email = "";
  let password = "";

  const emailChangeOnInput = () => {
    if (/@gmail.com$/.test(emailInput.value)) {
      email = normalizeGmail(emailInput.value);
    } else {
      email = emailInput.value;
    }
  };

  const inputEventListeners = (boo) => {
    if (boo) {
      emailInput.addEventListener("input", () => emailChangeOnInput());
      passwordInput.addEventListener(
        "input",
        () => (password = passwordInput.value)
      );
    } else {
      emailInput.removeEventListener("input", () => emailChangeOnInput());
      passwordInput.removeEventListener(
        "input",
        () => (password = passwordInput.value)
      );
    }
  };

  const normalizeGmail = (str) => {
    const inx = str.indexOf("@");
    return str.substring(0, inx).replace(".", "") + str.substring(inx);
  };

  const signIn = async () => {
    await Auth.signInWithEmailAndPassword(email, password).catch((error) => {
      console.log(error);
      signUp();
    });
  };

  const signUp = async () => {
    await Auth.createUserWithEmailAndPassword(email, password).catch(
      (error) => {
        console.log(error);
        // ADD IF EMAIL USED IS IN DB
        const enteredEmailStored = email === local.email;
        if (error.code === "auth/email-already-in-use" || enteredEmailStored) {
          link();
        }
      }
    );
  };

  const link = async () => {
    const credentials = await firebase.auth.EmailAuthProvider.credential(
      email,
      password
    );
    await providerAuth.LogInToLink();
    await Auth.currentUser
      .linkWithCredential(await credentials)
      .then((result) => {
        //   IF UID UPDATED DUE TO LINKING OF ACCOUNTS
        console.log(result);
        if (
          result.user.uid !== local.uid &&
          result.user.email === local.email
        ) {
          localUser.uid = result.user.uid;
          console.log("UserID Updated");
          if (!local.photoURL) {
            local.photoURL = result.user.photoURL;
          }
        }
      })
      .catch();
  };

  return {
    signIn,
    inputEventListeners,
  };
})();

// SIGN IN PROVIDER
const providerAuth = (() => {
  const googleProvider = new firebase.auth.GoogleAuthProvider();
  const facebookProvider = new firebase.auth.FacebookAuthProvider();
  const authMethods = [googleProvider, facebookProvider];

  const assign = async (button) => {
    button.id === "google"
      ? await signIn(googleProvider)
      : await signIn(facebookProvider);
  };

  const signIn = (provider) => {
    return Auth.signInWithPopup(provider)
      .then((result) => {
        if (result) return true;
      })
      .catch();
  };

  const linkWithProvider = (provider) => {
    return Auth.currentUser
      .linkWithPopup(provider)
      .catch((error) => linkWithProvider(provider));
  };

  //   If users email is already registered with another log in method it attempts the log in with all the
  //   provider methods until successful so it can link accounts
  const LogInToLink = async () => {
    for (i = 0; i < authMethods.length - 1; i++) {
      if (await signIn(authMethods[i])) {
        break;
      }
    }
  };

  return {
    assign,
    signIn,
    LogInToLink,
  };
})();

// EXPERIENCE BUTTON CONTROLS
const experience = (() => {
  const showSelectedExperience = (but, boolean) => {
    but.setAttribute("data-experience-selected", `${boolean}`);
    but.innerHTML = boolean
      ? `<i class="fa fa-heart" aria-hidden="true"></i>  REMOVE FROM LIST`
      : `<i class="fa fa-heart-o" aria-hidden="true"></i>  ADD TO LIST`;
  };

  const toggle = (but) => {
    const expSelected = but.getAttribute("data-experience-selected");
    expSelected === "false"
      ? showSelectedExperience(but, true)
      : showSelectedExperience(but, false);

    localStorageFunction.setExperience(but);
  };

  const initializeButton = (but, trip, exp) => {
    but.setAttribute("data-experience-selected", "false");
    but.setAttribute("data-tripid", trip);
    but.setAttribute("data-experienceid", exp);
    but.addEventListener("click", () => {
      toggle(but);
      if (localStorageFunction.getLoggedInStatus() !== "true") {
        showSignIn(true);
      }
    });
  };
  const buttonInfo = (but) => {
    const experienceInfo = but
      .closest(".w-dyn-item")
      .querySelector("[data-gallery='true']");
    const trip = experienceInfo.getAttribute("data-tripid");
    const exp = experienceInfo.getAttribute("data-experienceid");
    initializeButton(but, trip, exp);
  };

  const loadSelectedExperiences = (but) => {
    const tripID = but.getAttribute("data-tripid");
    const expID = but.getAttribute("data-experienceid");
    if (localStorageFunction.experiencePrevSelected(tripID, expID) !== -1) {
      showSelectedExperience(but, true);
    }
  };

  const experienceButtons = document.querySelectorAll(".itin-exp-btns_txt");

  experienceButtons.forEach((but) => {
    buttonInfo(but);
  });

  const expButtons = (() => {
    experienceButtons.forEach((but) => {
      if (localStorageFunction.getLoggedInStatus() === "true") {
        loadSelectedExperiences(but);
      } else {
        showSelectedExperience(but, false);
      }
    });
  })();

  return {
    toggle,
    expButtons,
  };
})();

const toggleSignIn = (boolean) => {
  const logInOutDiv = document.getElementById("signin");

  if (boolean) {
    localStorageFunction.setLoggedInStatus(false);
    logInOutDiv.innerHTML = `<a id="log-in" href="#" class="nav-link w-nav-link">Sign In</a>`;
    const logInButton = document.getElementById("log-in");
    logInButton.addEventListener("click", () => showSignIn(true));
  } else {
    localStorageFunction.setLoggedInStatus(true);
    logInOutDiv.innerHTML = `<div id="user-pic" class="nav-link w-nav-link" ></div>`;
    const userPic = document.getElementById("user-pic");
    userPic.style.backgroundImage = `url("${localStorageFunction.localUser.photoURL}")`;
  }
};

const loadLogInEventListeners = (boo) => {
  const google = document.getElementById("google");
  const facebook = document.getElementById("facebook");
  const emailAuth = document.getElementById("email");
  const providers = [google, facebook];

  if (boo) {
    credentialAuth.inputEventListeners(true);
    emailAuth.addEventListener("click", () => credentialAuth.signIn());
    providers.forEach((but) => {
      but.addEventListener("click", () => providerAuth.assign(but));
    });
  } else {
    credentialAuth.inputEventListeners(false);
    emailAuth.removeEventListener("click", () => credentialAuth.signIn());
    providers.forEach((but) =>
      but.removeEventListener("click", () => providerAuth.assign(but))
    );
  }
};

const showSignIn = (boo) => {
  if (boo) {
    loadLogInEventListeners(true);
    firebaseDiv.removeAttribute("hidden");
  } else {
    loadLogInEventListeners(false);
    firebaseDiv.setAttribute("hidden", "");
  }
};

Auth.onAuthStateChanged((user) => {
  if (user) {
    localStorageFunction.setUser(user);
    toggleSignIn(false);
    showSignIn(false);
    experience.expButtons;
  } else {
    localStorageFunction.setLoggedInStatus(false);
    toggleSignIn(true);
    experience.expButtons;
  }
});
