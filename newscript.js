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
  const getLoggedInStatus = () => localStorage.getItem("LoggedIn");
  const setLoggedInStatus = (boolean) =>
    localStorage.setItem("LoggedIn", boolean);

  const getUID = () => localStorage.getItem("UserID");
  const setUID = (result) => localStorage.setItem("UserID", result.user.uid);

  const getEmail = () => localStorage.getItem("Email");
  const setEmail = (result) => localStorage.setItem("Email", result.user.email);

  const getPic = () => localStorage.getItem("Pic");
  const setPic = (result) => localStorage.setItem("Pic", result.user.photoURL);

  const setUser = (result) => {
    setLoggedInStatus(true);
    setUID(result);
    setEmail(result);
    setPic(result);
    console.log(result);
    console.log(localStorage);
  };

  return {
    getUID,
    setUID,
  };
})();

// SIGN IN CREDENTIALS
const credentialAuth = (() => {
  // Test Info
  const email = "benjamin.gambling@gmail";
  const password = "test123";

  const signIn = async () => {
    await Auth.signInWithEmailAndPassword(email, password)
      .then((result) => localStorageFunction.setUser(result))
      .catch((error) => {
        console.log(error);
        signUp();
      });
  };

  const signUp = async () => {
    await Auth.createUserWithEmailAndPassword(email, password)
      .then((result) => localStorageFunction.setUser(result))
      .catch((error) => {
        console.log(error);
        // IF EMAIL USED IS IN DB (CHANGE WHEN GET DB)
        if (localStorageFunction.getEmail() === email) {
          link();
        }
      });
  };

  const link = async () => {
    const credentials = await firebase.auth.EmailAuthProvider.credential(
      email,
      password
    );
    // Needs to sign user in to link so try's other provider methods
    await providerAuth.LogInToLink();
    await Auth.currentUser
      .linkWithCredential(await credentials)
      .then((result) => localStorageFunction.setUID(result))
      .catch((error) => console.log(error));
  };

  return {
    signIn,
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
        localStorageFunction.setUID(result);
        if (result) return true;
      })
      .catch((error) => console.log(error));
  };

  const linkWithProvider = (provider) => {
    return Auth.currentUser
      .linkWithPopup(provider)
      .then(function (result) {
        console.log(result);
      })
      .catch(function (error) {
        console.log(error);
        linkWithProvider(provider);
      });
  };

  //   If users email is already registered with another log in method it attempts the log in with all the
  //   provider methods until successful so it can link accounts
  const LogInToLink = async () => {
    for (i = 0; i < authMethods.length - 1; i++) {
      if (await signIn(authMethods[i])) {
        console.log(i);
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

const loadLogInEventListeners = () => {
  const emailAuth = document.getElementById("email");
  emailAuth.addEventListener("click", () => {
    credentialAuth.signIn();
  });

  const google = document.getElementById("google");
  const facebook = document.getElementById("facebook");
  [google, facebook].forEach((button) => {
    button.addEventListener("click", () => providerAuth.assign(button));
  });
};

const experience = (() => {
  const add = (but) => {
    but.setAttribute("data-experience-selected", "true");
    but.innerHTML = `<i class="fa fa-heart" aria-hidden="true"></i>  REMOVE FROM LIST`;
  };
  const remove = (but) => {
    but.setAttribute("data-experience-selected", "false");
    but.innerHTML = `<i class="fa fa-heart-o" aria-hidden="true"></i>  ADD TO LIST`;
  };

  const initializeButton = (but) => {
    but.setAttribute("data-experience-selected", "false");
    but.addEventListener("click", () => {
      toggle(but);
      if (userProfile.loggedIn() === false) {
        loadLogInEventListeners();
        firebaseDiv.removeAttribute("hidden");
      }
    });
  };

  const toggle = (but) => {
    but.getAttribute("data-experience-selected") === "true"
      ? remove(but)
      : add(but);
  };
  return {
    add,
    remove,
    initializeButton,
    toggle,
  };
})();

// USER PROFILE (IF PRESENT)
const userProfile = (() => {
  const loggedIn = () => (localStorageFunction.getUID() ? true : false);
  const setID = () => {};
  const setEmail = () => {};
  const setPic = () => {};
  const setExperiences = () => {};

  return { loggedIn, setID, setEmail, setPic, setExperiences };
})();

window.onload = () => {
  const addExperienceButtons = document.querySelectorAll(".itin-exp-btns_txt");
  addExperienceButtons.forEach((but) => {
    experience.initializeButton(but);
  });
};

// EMAIL SUCCESSFUL AUTH

// AUTH
