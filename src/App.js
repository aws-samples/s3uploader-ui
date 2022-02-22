import React, {useState, useRef} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import AppLayout from "@awsui/components-react/app-layout";
import FormField from "@awsui/components-react/form-field";
import Alert from "@awsui/components-react/alert";
import Container from "@awsui/components-react/container";
import Header from "@awsui/components-react/header";
import SideNavigation from '@awsui/components-react/side-navigation';
import Button from "@awsui/components-react/button";
import TokenGroup from "@awsui/components-react/token-group";
import TopNavigation from "@awsui/components-react/top-navigation"
import SpaceBetween from "@awsui/components-react/space-between";
import ProgressBar from "@awsui/components-react/progress-bar";
import Amplify, {Auth, Storage} from 'aws-amplify';
import {Authenticator} from '@aws-amplify/ui-react';

import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

const appLayoutLabels = {
    navigation: 'Side navigation',
    navigationToggle: 'Open side navigation',
    navigationClose: 'Close side navigation',
    notifications: 'Notifications',
    tools: 'Help panel',
    toolsToggle: 'Open help panel',
    toolsClose: 'Close help panel'
};

const ServiceNavigation = () => {
    const location = useLocation();
    let navigate = useNavigate();

    function onFollowHandler(event) {
        if (!event.detail.external) {
            event.preventDefault();
            navigate(event.detail.href);
        }
    }

    return (
        <SideNavigation
            activeHref={location.pathname}
            header={{href: "/", text: "S3 Object Uploader"}}
            onFollow={onFollowHandler}
            items={[
                {type: "link", text: "Upload", href: "/"},
                {type: "divider"},
                {
                    type: "link",
                    text: "AWS Solutions Architect",
                    href: "https://workshops.aws",
                    external: true
                }
            ]}
        />
    );
}

function formatBytes(a, b = 2, k = 1024) {
    let d = Math.floor(Math.log(a) / Math.log(k));
    return 0 === a ? "0 Bytes" : parseFloat((a / Math.pow(k, d)).toFixed(Math.max(0, b))) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d];
}

const Content = () => {
    const hiddenFileInput = useRef(null);
    const [visibleAlert, setVisibleAlert] = useState(false);
    const [uploadList, setUploadList] = useState([]);
    const [fileList, setFileList] = useState([]);
    const [historyList, setHistoryList] = useState([]);
    const [historyCount, setHistoryCount] = useState(0);
    const handleClick = () => {
        hiddenFileInput.current.value = ""; // This avoids errors when selecting the same files multiple times
        hiddenFileInput.current.click();
    };
    const handleChange = e => {
        e.preventDefault();
        let i, tempUploadList = [];
        for (i = 0; i < e.target.files.length; i++) {
            tempUploadList.push({
                label: e.target.files[i].name,
                labelTag: formatBytes(e.target.files[i].size),
                description: 'File type: ' + e.target.files[i].type,
                icon: 'file',
                id: i
            })
        }
        setUploadList(tempUploadList);
        setFileList(e.target.files);
    };

    function progressBarFactory(fileObject) {
        let localHistory = historyList;
        const id = localHistory.length;
        localHistory.push({
            id: id,
            percentage: 0,
            filename: fileObject.name,
            filetype: fileObject.type,
            filesize: formatBytes(fileObject.size),
            status: 'in-progress'
        });
        setHistoryList(localHistory);
        return (progress) => {
            let tempHistory = historyList.slice();
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            tempHistory[id].percentage = percentage;
            if (percentage === 100) {
                tempHistory[id]['status'] = 'success';
            }
            setHistoryList(tempHistory);
        };
    }

    const handleUpload = () => {
        if (uploadList.length === 0) {
            setVisibleAlert(true);
        } else {
            console.log('Uploading files to S3');
            let i, progressBar = [], uploadCompleted = [];
            for (i = 0; i < uploadList.length; i++) {
                // If the user has removed some items from the Upload list, we need to correctly reference the file
                const id = uploadList[i].id;
                progressBar.push(progressBarFactory(fileList[id]));
                setHistoryCount(historyCount + 1);
                uploadCompleted.push(Storage.put(fileList[id].name, fileList[id], {
                        progressCallback: progressBar[i],
                        level: "protected"
                    }).then(result => {
                        // Trying to remove items from the upload list as they complete. Maybe not work correctly
                        // setUploadList(uploadList.filter(item => item.label !== result.key));
                        console.log(`Completed the upload of ${result.key}`);
                    })
                );
            }
            // When you finish the loop, all items should be removed from the upload list
            Promise.all(uploadCompleted)
                .then(() => setUploadList([]));
        }
    }

    const handleDismiss = (itemIndex) => {
        setUploadList([
            ...uploadList.slice(0, itemIndex),
            ...uploadList.slice(itemIndex + 1)
        ]);
    };

    const List = ({list}) => (
        <>
            {list.map((item) => (
                <ProgressBar
                    key={item.id}
                    status={item.status}
                    value={item.percentage}
                    variant="standalone"
                    additionalInfo={item.filesize}
                    description={item.filetype}
                    label={item.filename}
                />
            ))}
        </>
    );
    return (
        <SpaceBetween size="l">
            <Container
                id="s3-upload-multiple-objects"
                header={
                    <Header variant="h2">
                        Upload multiple objects to S3
                    </Header>
                }
            >
                {
                    <div>
                        <Alert
                            onDismiss={() => setVisibleAlert(false)}
                            visible={visibleAlert}
                            dismissAriaLabel="Close alert"
                            dismissible
                            type="error"
                            header="No files selected"
                        >
                            You must select the files that you want to upload.
                        </Alert>

                        <FormField
                            label='Object Upload'
                            description='Click on the Open button and select the files that you want to upload'
                        />

                        <SpaceBetween direction="horizontal" size="xs">
                            <Button onClick={handleClick}
                                    iconAlign="left"
                                    iconName="upload"
                            >
                                Choose file[s]
                            </Button>
                            <input
                                type="file"
                                ref={hiddenFileInput}
                                onChange={handleChange}
                                style={{display: 'none'}}
                                multiple
                            />
                            <Button variant="primary" onClick={handleUpload}>Upload</Button>
                        </SpaceBetween>

                        <TokenGroup
                            onDismiss={({detail: {itemIndex}}) => {
                                handleDismiss(itemIndex)
                            }}
                            items={uploadList}
                            alignment="vertical"
                            limit={10}
                        />
                    </div>
                }
            </Container>
            <Container
                id="history"
                header={
                    <Header variant="h2">
                        History
                    </Header>
                }
            >
                <List list={historyList}/>
            </Container>
        </SpaceBetween>

    );
};

function App() {
    const [navigationOpen, setNavigationOpen] = useState(true);
    const navbarItemClick = e => {
        console.log(e);
        if (e.detail.id === 'signout') {
            Auth.signOut().then(() => {
                window.location.reload();
            });
        }
    }

    return (
        <Authenticator>
            {({signOut, user}) => (
                <>
                    <div id="navbar" style={{fontSize: 'body-l !important', position: 'sticky', top: 0, zIndex: 1002}}>
                        <TopNavigation
                            identity={{
                                href: "#",
                                title: "S3 Object Upload Tool",
                                logo: {
                                    src:
                                        "data:image/svg+xml;base64,//48AD8AeABtAGwAIAB2AGUAcgBzAGkAbwBuAD0AIgAxAC4AMAAiACAAZQBuAGMAbwBkAGkAbgBnAD0AIgB1AHQAZgAtADEANgAiAD8APgANAAoAPAAhAC0ALQAgAEcAZQBuAGUAcgBhAHQAbwByADoAIABBAGQAbwBiAGUAIABJAGwAbAB1AHMAdAByAGEAdABvAHIAIAAxADQALgAwAC4AMAAsACAAUwBWAEcAIABFAHgAcABvAHIAdAAgAFAAbAB1AGcALQBJAG4AIAAuACAAUwBWAEcAIABWAGUAcgBzAGkAbwBuADoAIAA2AC4AMAAwACAAQgB1AGkAbABkACAANAAzADMANgAzACkAIAAgAC0ALQA+AA0ACgA8ACEARABPAEMAVABZAFAARQAgAHMAdgBnACAAUABVAEIATABJAEMAIAAiAC0ALwAvAFcAMwBDAC8ALwBEAFQARAAgAFMAVgBHACAAMQAuADEALwAvAEUATgAiACAAIgBoAHQAdABwADoALwAvAHcAdwB3AC4AdwAzAC4AbwByAGcALwBHAHIAYQBwAGgAaQBjAHMALwBTAFYARwAvADEALgAxAC8ARABUAEQALwBzAHYAZwAxADEALgBkAHQAZAAiAD4ADQAKADwAcwB2AGcAIAB2AGUAcgBzAGkAbwBuAD0AIgAxAC4AMQAiACAAaQBkAD0AIgBMAGEAeQBlAHIAXwAxACIAIAB4AG0AbABuAHMAPQAiAGgAdAB0AHAAOgAvAC8AdwB3AHcALgB3ADMALgBvAHIAZwAvADIAMAAwADAALwBzAHYAZwAiACAAeABtAGwAbgBzADoAeABsAGkAbgBrAD0AIgBoAHQAdABwADoALwAvAHcAdwB3AC4AdwAzAC4AbwByAGcALwAxADkAOQA5AC8AeABsAGkAbgBrACIAIAB4AD0AIgAwAHAAeAAiACAAeQA9ACIAMABwAHgAIgANAAoACQAgAHcAaQBkAHQAaAA9ACIANwAwAHAAeAAiACAAaABlAGkAZwBoAHQAPQAiADcAMABwAHgAIgAgAHYAaQBlAHcAQgBvAHgAPQAiADAAIAAwACAANwAwACAANwAwACIAIABlAG4AYQBiAGwAZQAtAGIAYQBjAGsAZwByAG8AdQBuAGQAPQAiAG4AZQB3ACAAMAAgADAAIAA3ADAAIAA3ADAAIgAgAHgAbQBsADoAcwBwAGEAYwBlAD0AIgBwAHIAZQBzAGUAcgB2AGUAIgA+AA0ACgA8AGcAPgANAAoACQA8AGcAPgANAAoACQAJADwAZwA+AA0ACgAJAAkACQA8AGcAPgANAAoACQAJAAkACQA8AHAAYQB0AGgAIABmAGkAbABsAC0AcgB1AGwAZQA9ACIAZQB2AGUAbgBvAGQAZAAiACAAYwBsAGkAcAAtAHIAdQBsAGUAPQAiAGUAdgBlAG4AbwBkAGQAIgAgAGYAaQBsAGwAPQAiACMAMQA0ADYARQBCADQAIgAgAGQAPQAiAE0ANgAzAC4AOQA1ACwAMQA1AC4ANwA4ADYAYwAwACwANAAuADAAMAA2AC0AMQAyAC4AOQA2ADMALAA3AC4AMgAzADgALQAyADgALgA5ADQAOQAsADcALgAyADMAOAANAAoACQAJAAkACQAJAGMALQAxADUALgA5ADgAOAAsADAALQAyADgALgA5ADUAMQAtADMALgAyADMAMgAtADIAOAAuADkANQAxAC0ANwAuADIAMwA4AGwAOQAuADYANQAsADQAMwAuADgAMwA5AGMAMAAsADIALgA2ADcAMgAsADgALgA2ADMANwAsADQALgA4ADIANgAsADEAOQAuADMAMAAxACwANAAuADgAMgA2AGMAMQAwAC4ANgA2ADIALAAwACwAMQA5AC4AMgA5ADkALQAyAC4AMQA1ADQALAAxADkALgAyADkAOQAtADQALgA4ADIANgBsADAALAAwAA0ACgAJAAkACQAJAAkATAA2ADMALgA5ADUALAAxADUALgA3ADgANgB6ACIALwA+AA0ACgAJAAkACQA8AC8AZwA+AA0ACgAJAAkACQA8AGcAPgANAAoACQAJAAkACQA8AHAAYQB0AGgAIABmAGkAbABsAC0AcgB1AGwAZQA9ACIAZQB2AGUAbgBvAGQAZAAiACAAYwBsAGkAcAAtAHIAdQBsAGUAPQAiAGUAdgBlAG4AbwBkAGQAIgAgAGYAaQBsAGwAPQAiACMAMQA0ADYARQBCADQAIgAgAGQAPQAiAE0ANgAzAC4AOQA1ACwAMQAyAC4ANwA4ADYAYwAwAC0ANAAuADAAMAA0AC0AMQAyAC4AOQA2ADMALQA3AC4AMgAzADcALQAyADgALgA5ADQAOQAtADcALgAyADMANwANAAoACQAJAAkACQAJAGMALQAxADUALgA5ADgAOAAsADAALQAyADgALgA5ADUAMQAsADMALgAyADMAMwAtADIAOAAuADkANQAxACwANwAuADIAMwA3AGMAMAAsADQALgAwADAANgAsADEAMgAuADkANgAzACwANwAuADIAMwA4ACwAMgA4AC4AOQA1ADEALAA3AC4AMgAzADgAQwA1ADAALgA5ADgANwAsADIAMAAuADAAMgA0ACwANgAzAC4AOQA1ACwAMQA2AC4ANwA5ADIALAA2ADMALgA5ADUALAAxADIALgA3ADgANgBMADYAMwAuADkANQAsADEAMgAuADcAOAA2AA0ACgAJAAkACQAJAAkAegAiAC8APgANAAoACQAJAAkAPAAvAGcAPgANAAoACQAJADwALwBnAD4ADQAKAAkAPAAvAGcAPgANAAoAPAAvAGcAPgANAAoAPAAvAHMAdgBnAD4ADQAKAA==",
                                    alt: "S3 Object Upload tool"
                                }
                            }}
                            utilities={[
                                {
                                    type: "button",
                                    text: "AWS",
                                    href: "https://aws.amazon.com/",
                                    external: true,
                                    externalIconAriaLabel: " (opens in a new tab)"
                                },
                                {
                                    type: "menu-dropdown",
                                    text: user.username,
                                    description: user.username,
                                    iconName: "user-profile",
                                    onItemClick: navbarItemClick,
                                    items: [
                                        {id: "profile", text: "Profile"},
                                        {id: "preferences", text: "Preferences"},
                                        {id: "security", text: "Security"},
                                        {
                                            id: "feedback",
                                            text: "Feedback",
                                            href: "#",
                                            external: true,
                                            externalIconAriaLabel:
                                                " (opens in new tab)"
                                        },
                                        {id: "signout", text: "Sign out"}
                                    ]
                                }
                            ]}
                            i18nStrings={{
                                searchIconAriaLabel: "Search",
                                searchDismissIconAriaLabel: "Close search",
                                overflowMenuTriggerText: "More"
                            }}
                        />
                    </div>
                    <AppLayout
                        content={<Content/>}
                        headerSelector='#navbar'
                        navigation={<ServiceNavigation/>}
                        navigationOpen={navigationOpen}
                        onNavigationChange={({detail}) => setNavigationOpen(detail.open)}
                        ariaLabels={appLayoutLabels}
                    />
                </>
            )}
        </Authenticator>
    );
}

export default App;
