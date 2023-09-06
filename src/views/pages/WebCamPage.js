import Webcam from "react-webcam";
import React, { Component } from "react";
import {
  Row,
  Col,
} from "reactstrap";
import NotificationSystem from "react-notification-system";
import PageSpinner from "../../components/PageSpinner";

class WebCamPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      imageSrc: "",
      isFrontCamera: true
    };
  }


  render() {
    return (
      <>
        {
          this.state.showLoader
            ? <PageSpinner showLoader={this.state.showLoader} />
            : <Row style={{ justifyContent: "center", alignItems: "center", marginTop: 20 }}>
              <Col
                xs="12"
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Webcam
                  audio={false}
                  height="100%"
                  width="100%"
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    frameRate: 30,
                    facingMode: this.state.isFrontCamera ? "user" : "environment"
                  }}
                >
                  {({ getScreenshot }) => (
                    <>
                      <button
                        style={{
                          marginTop: 10,
                          marginRight: 20
                        }}
                        onClick={() => {
                          const imageSrc = getScreenshot();
                          this.setState({ imageSrc });
                        }}
                      >
                        Capture photo
                      </button>
                      <button
                        style={{
                          marginTop: 10
                        }}
                        onClick={() => this.setState({ isFrontCamera: !this.state.isFrontCamera })}
                      >
                        Switch Camera
                      </button>
                    </>
                  )}
                </Webcam>
                <img
                  style={{
                    marginTop: 20
                  }}
                  width="100%"
                  height="auto"
                  src={this.state.imageSrc}
                  alt=""
                />
              </Col>
            </Row>
        }
        <NotificationSystem
          dismissible={false}
          ref={(notificationSystem) =>
            (this.notificationSystem = notificationSystem)
          }
        />
      </>
    );
  }
}

export default WebCamPage;