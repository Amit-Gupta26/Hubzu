/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from "react";
import {
  Platform,
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

const HOME_URL = "https://www.owners.com/";
const HOWITWORKS_URL = "https://www.owners.com/";
const SEARCH_URL =
  "https://www.owners.com/homes-for-sale/city/1117661/ga/atlanta?";
const SEARCH_URL_CANA =
  "https://www.owners.com/homes-for-sale/city/1393612/va/cana?";

// const injectScript = (function () {
//     window.onclick = function(e) {
//       var originalPostMessage = window.postMessage;

//   var patchedPostMessage = function(message, targetOrigin, transfer) {
//     originalPostMessage(message, targetOrigin, transfer);
//   };

//   patchedPostMessage.toString = function() {
//     return String(Object.hasOwnProperty).replace('hasOwnProperty', 'postMessage');
//   };

//   window.postMessage = patchedPostMessage;
//     }
//   }());

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
    this.checkPermission();
    this.createNotificationListeners();
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
              console.log("Token"+token);
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
        if (this.state.searchUrl == SEARCH_URL) {
          this.setState({
            searchUrl: SEARCH_URL_CANA
          });
        } else {
          this.setState({
            searchUrl: SEARCH_URL
          });
        }
      });

    /*
     * If your app is in background, you can listen for when a notification is clicked / tapped / opened as follows:
     * */
    this.notificationOpenedListener = firebase
      .notifications()
      .onNotificationOpened(notificationOpen => {
        const { title, body } = notificationOpen.notification;
        // this.showAlert(title, body);
        if (this.state.searchUrl == SEARCH_URL) {
          this.setState({
            searchUrl: SEARCH_URL_CANA
          });
        } else {
          this.setState({
            searchUrl: SEARCH_URL
          });
        }
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
      if (this.state.searchUrl == SEARCH_URL) {
        this.setState({
          searchUrl: SEARCH_URL_CANA
        });
      } else {
        this.setState({
          searchUrl: SEARCH_URL
        });
      }
    }
    /*
     * Triggered for data only payload in foreground
     * */
    this.messageListener = firebase.messaging().onMessage(message => {
      //process data message
      console.log(JSON.stringify(message));
      if (this.state.searchUrl == SEARCH_URL) {
        this.setState({
          searchUrl: SEARCH_URL_CANA
        });
      } else {
        this.setState({
          searchUrl: SEARCH_URL
        });
      }
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

  onNavigationStateChange(navState) {
    // If we get redirected back to the HOME_URL we know that we are logged in. If your backend does something different than this
    // change this line.
    // if (navState.url == HOWITWORKS_URL) {
    CookieManager.get(HOWITWORKS_URL, (err, cookie) => {
      let isAuthenticated;
      // If it differs, change `cookie.remember_me` to whatever the name for your persistent cookie is!!!
      if (cookie && cookie.hasOwnProperty("uuid")) {
        let uuidVal = cookie.uuid;
        isAuthenticated = true;
        let data = {
          method: "POST",
          credentials: "same-origin",
          mode: "same-origin",
          body: JSON.stringify({
            deviceType: "ios",
            deviceId: this.state.firbaseToken ? this.state.firbaseToken : ""
          }),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRFToken": ""
          }
        };
        this.registerForPush(data, uuidVal);
      } else {
        isAuthenticated = false;
      }
      this.setState({
        loggedIn: isAuthenticated,
        loadedCookie: true
      });
    });
    this.setState({
      loggedIn: true
    });
    // }
  }

  registerForPush = (postData, userId) => {
    return fetch(
      "https://www.owners.com/user/v2/devices/register/" + userId,
      postData
    )
      .then(response => response.json())
      .then(responseJson => {
        this.state.loggedIn = true;
        console.log(responseJson);
      })
      .catch(error => {
        console.error(error);
      });
  };

  onMessage({ nativeEvent }) {
    const data = nativeEvent.data;

    if (data !== undefined && data !== null) {
      Linking.openURL(data);
    }
  }

  // onWebViewMessage(event) {
  //   console.log("Message received from webview");

  //   let msgData;
  //   try {
  //     msgData = JSON.parse(event.nativeEvent.data);
  //   } catch (err) {
  //     console.warn(err);
  //     return;
  //   }

  //   switch (msgData.targetFunc) {
  //     case "handleDataReceived":
  //       this[msgData.targetFunc].apply(this, [msgData]);
  //       break;
  //   }
  // }

  // onLoad(e) {
  //   // onload is called multiple times...
  //   if ( this.state.loaded ) {
  //     return
  //   }
  //   this.setState({ loaded: true }, () => this.bridge.injectJavaScript('window.onLoad()'))
  // }
  // onMessage(payload) {
  //   console.log('got message from web view', payload)
  // }

  render() {
    // const jsCode = `window.postMessage('test');`;
    return (
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.viewContainer}>
          <WebView
            ref={"webview"}
            onLoad={() => this.hideSpinner()}
            automaticallyAdjustContentInsets={false} 
            // style={styles.webView}
             source={{ uri: HOME_URL }}
            javaScriptEnabled={true}
            // onNavigationStateChange={this.onNavigationStateChange.bind(this)}
            // injectedJavaScript={jsCode}
            // onMessage={this.onWebViewMessage}
            // startInLoadingState={true}
            scalesPageToFit={true}
            // onMessage={this.onWebViewMessage}
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
