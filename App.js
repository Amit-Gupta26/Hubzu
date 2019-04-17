
import React, { Component } from "react";
import {
  StyleSheet,
  View,
  Alert,
  WebView,
  SafeAreaView,
  ActivityIndicator,
  Dimensions
} from "react-native";
import firebase from "react-native-firebase";
import CookieManager from "react-native-cookies";

const HOME_URL = "https://buy-cif-feature-web-qe.internal.hubzu.com/";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedIn: false,
      loadedCookie: false,
      firbaseToken: "",
      searchUrl: HOME_URL,
      visible: true,
      loaded: false
    };
  }

  hideSpinner() {
    this.setState({ visible: false });
  }

  componentDidMount() {
    this.createNotificationChannel();
    this.checkPermission();
    this.createNotificationListeners();
  }

  createNotificationChannel = () => {
    // Build a channel
    const channel = new firebase.notifications.Android.Channel(
      "hubzu-channel",
      "Hubzu Channel",
      firebase.notifications.Android.Importance.Max
    ).setDescription("Hubzu apps notification channel");

    // Create the channel
    firebase.notifications().android.createChannel(channel);
  };

  registerToken(userId) {
    let data = {
      method: "POST",
      credentials: "same-origin",
      mode: "same-origin",
      body: JSON.stringify({
        deviceType: "ios",
        deviceId: this.state.firbaseToken
      }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    };
    this.registerForPush(data, userId);
  };

  unregisterToken() {
    fetch(
      `https://buy-cif-feature-web-qe.internal.hubzu.com/portal/buyer-app/devices/unregister/${
        this.state.firbaseToken
      }`,
      {
        method: "delete"
      }
    ).then(response =>
      response.json().then(json => {
        console.log(json);
      })
    );
  }

  async checkPermission() {
    const enabled = await firebase.messaging().hasPermission();
    if (enabled) {
      this.getToken();
    } else {
      this.requestPermission();
    }
  }

  async getToken() {
    firebase
      .messaging()
      .hasPermission()
      .then(enabled => {
        if (enabled) {
          firebase
            .messaging()
            .getToken()
            .then(token => {
              this.state.firbaseToken = token;
              console.log("token#####" + token);
            })
            .catch(error => {
              console.log(error);
            });
        } else {
          firebase
            .messaging()
            .requestPermission()
            .then(() => {
              console.log("Got permission");
            })
            .catch(error => {
              console.log(error);
            });
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  async requestPermission() {
    try {
      await firebase.messaging().requestPermission();
      // User has authorised
      this.getToken();
    } catch (error) {
      // User has rejected permissions
      console.log("permission rejected");
    }
  }

  componentWillUnmount() {
    this.notificationListener();
    this.notificationOpenedListener();
  }

  async createNotificationListeners() {
    /*
     * Triggered when a particular notification has been received in foreground
     * */
    this.notificationListener = firebase
      .notifications()
      .onNotification(notification => {
        const { title, body } = notification;
        // this.showAlert(title, body);
        // if (this.state.searchUrl == SEARCH_URL) {
        //   this.setState({
        //     searchUrl: SEARCH_URL_CANA
        //   })
        // }
        // else {
        //   this.setState({
        //     searchUrl: SEARCH_URL
        //   })
        // }
      });

    /*
     * If your app is in background, you can listen for when a notification is clicked / tapped / opened as follows:
     * */
    this.notificationOpenedListener = firebase
      .notifications()
      .onNotificationOpened(notificationOpen => {
        const { title, body } = notificationOpen.notification;
        // this.showAlert(title, body);
        // if (this.state.searchUrl == SEARCH_URL) {
        //   this.setState({
        //     searchUrl: SEARCH_URL_CANA
        //   })
        // }
        // else {
        //   this.setState({
        //     searchUrl: SEARCH_URL
        //   })
        // }
      });

    /*
     * If your app is closed, you can check if it was opened by a notification being clicked / tapped / opened as follows:
     * */
    const notificationOpen = await firebase
      .notifications()
      .getInitialNotification();
    if (notificationOpen) {
      const { title, body } = notificationOpen.notification;
      // this.showAlert(title, body);
      // if (this.state.searchUrl == SEARCH_URL) {
      //   this.setState({
      //     searchUrl: SEARCH_URL_CANA
      //   })
      // }
      // else {
      //   this.setState({
      //     searchUrl: SEARCH_URL
      //   })
      // }
    }
    /*
     * Triggered for data only payload in foreground
     * */
    this.messageListener = firebase.messaging().onMessage(message => {
      //process data message
      console.log(JSON.stringify(message));
      // if (this.state.searchUrl == SEARCH_URL) {
      //   this.setState({
      //     searchUrl: SEARCH_URL_CANA
      //   })
      // }
      // else {
      //   this.setState({
      //     searchUrl: SEARCH_URL
      //   })
      // }
    });
  }

  showAlert(title, body) {
    Alert.alert(
      title,
      body,
      [{ text: "OK", onPress: () => console.log("OK Pressed") }],
      { cancelable: false }
    );
  }

  // onNavigationStateChange(navState) {
  //   // If we get redirected back to the HOME_URL we know that we are logged in. If your backend does something different than this
  //   // change this line.
  //   // if (navState.url == HOWITWORKS_URL) {
  //   CookieManager.get(HOWITWORKS_URL, (err, cookie) => {
  //     let isAuthenticated;
  //     // If it differs, change `cookie.remember_me` to whatever the name for your persistent cookie is!!!
  //     if (cookie && cookie.hasOwnProperty("uuid")) {
  //       let uuidVal = cookie.uuid;
  //       isAuthenticated = true;
  //       let data = {
  //         method: "POST",
  //         credentials: "same-origin",
  //         mode: "same-origin",
  //         body: JSON.stringify({
  //           deviceType: "ios",
  //           deviceId: this.state.firbaseToken ? this.state.firbaseToken : ""
  //         }),
  //         headers: {
  //           Accept: "application/json",
  //           "Content-Type": "application/json",
  //           "X-CSRFToken": ""
  //         }
  //       };
  //       this.registerForPush(data, uuidVal);
  //     } else {
  //       isAuthenticated = false;
  //     }
  //     this.setState({
  //       loggedIn: isAuthenticated,
  //       loadedCookie: true
  //     });
  //   });
  //   this.setState({
  //     loggedIn: true
  //   });
  //   // }
  // }

  registerForPush = (postData, userId) => {
    console.log("registerForPush" + userId);
    return fetch(
      `https://buy-cif-feature-web-qe.internal.hubzu.com/portal/buyer-app/devices/register/${userId}`,
      postData
    )
      .then(response => response.json())
      .then(responseJson => {
        console.log("Success->>>>>>");
        this.state.loggedIn = true;
        console.log(responseJson);
      })
      .catch(error => {
        console.log("Error ->>>>>");
        console.error(error);
      });
  };

  onMessage({ nativeEvent }) {
    const data = nativeEvent.data;

    if (data !== undefined && data !== null) {
      Linking.openURL(data);
    }
  }

  onWebViewMessage(event) {
    console.log("Message received from webview");
    let msgData;
    try {
      console.log(event.nativeEvent.data);
      msgData = JSON.parse(event.nativeEvent.data);
      console.log("msgData######" + msgData.uuid);
    } catch (err) {
      console.warn(err);
      return;
    }

    switch (msgData.message) {
      case "PostMessageWebViewSignin":
        let uuid = msgData.uuid;
        this.registerToken(uuid);
        break;
      case "PostMessageWebViewSignout":
        this.unregisterToken();
        break;
    }
  }

  render() {
    const patchPostMessageFunction = () => {
      var originalPostMessage = window.postMessage;
      var patchedPostMessage = function(message, targetOrigin, transfer) {
        originalPostMessage(message, targetOrigin, transfer);
      };

      patchedPostMessage.toString = () => {
        return String(Object.hasOwnProperty).replace(
          "hasOwnProperty",
          "postMessage"
        );
      };
      window.postMessage = patchedPostMessage;
    };

    const patchPostMessageJsCode =
      "(" + String(patchPostMessageFunction) + ")();";

    return (
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.viewContainer}>
          <WebView
            useWebKit={true}
            ref={"webview"}
            onLoad={() => this.hideSpinner()}
            automaticallyAdjustContentInsets={false}
            source={{ uri: this.state.searchUrl }}
            javaScriptEnabled={true}
            // onNavigationStateChange={this.onNavigationStateChange.bind(this)}
            injectedJavaScript={patchPostMessageJsCode}
            onMessage={this.onWebViewMessage}
            // scalesPageToFit={true}
            onLoadStart={() => {
              console.log("LOAD START ");
            }}
            onLoadEnd={() => {
              console.log("LOAD END");
            }}
            onError={err => {
              console.log("ERROR ");
              console.log(err);
            }}
          />
          {this.state.visible && (
            <ActivityIndicator
              style={{
                position: "absolute",
                top: Dimensions.get("window").height / 2 - 50,
                left: Dimensions.get("window").width / 2 - 20
              }}
              size="large"
            />
          )}
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  },
  viewContainer: {
    flex: 1,
    backgroundColor: "#F5FCFF"
  },
  mainContainer: {
    justifyContent: "flex-start",
    flex: 1,
    margin: 0
  }
});
