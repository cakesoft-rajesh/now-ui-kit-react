import React from "react";
import { Spinner } from "reactstrap";

class PageSpinner extends React.Component {
    render() {
        const { showLoader } = this.props;
        return showLoader ? (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "fixed",
                    width: "100%",
                    height: "100%",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    zIndex: 99999
                }}
            >
                <Spinner
                    style={{
                        color: "#2ca8ff",
                        fontSize: "20px",
                        height: "4rem",
                        width: "4rem"
                    }}
                />
            </div>
        ) : null;
    }
}

export default PageSpinner;
