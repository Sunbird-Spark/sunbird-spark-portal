import { useEffect, useRef } from 'react';

// Note: Web component is loaded via <script> tag in index.html
// This ensures jQuery and Reflect are available before the component initializes


const playerConfig = {
    context: {
        mode: "play",
        partner: [],
        pdata: {
            id: "dev.sunbird.portal",
            ver: "5.2.0",
            pid: "sunbird-portal"
        },
        contentId: "do_21374910251798528014586",
        sid: "6d1898db-d783-4f83-8b92-4a36636e0d2f",
        uid: "anonymous",
        timeDiff: -0.089,
        channel: "01269878797503692810",
        tags: ["01269878797503692810"],
        did: "3ca74a4c5fbce6b7b7f5cd12cebb1682",
        contextRollup: {
            l1: "01269878797503692810"
        },
        objectRollup: {},
        userData: {
            firstName: "Guest",
            lastName: ""
        }
    },
    config: {
        showEndPage: true,
        endPage: [{
            template: "assessment",
            contentType: ["SelfAssess"]
        }],
        showStartPage: true,
        host: "",
        overlay: {
            showUser: false
        },
        splash: {
            text: "",
            icon: "",
            bgImage: "assets/icons/splacebackground_1.png",
            webLink: ""
        },
        apislug: "/action",
        repos: ["/sunbird-plugins/renderer"],
        plugins: [
            {
                id: "org.sunbird.iframeEvent",
                ver: 1,
                type: "plugin"
            },
            {
                id: "org.sunbird.player.endpage",
                ver: 1.1,
                type: "plugin"
            }
        ],
        sideMenu: {
            showShare: false,
            showDownload: true,
            showExit: false
        }
    },
    metadata: {
        copyright: "2009",
        subject: ["Environmental Studies"],
        channel: "01345815127107174426",
        language: ["English"],
        mimeType: "application/pdf",
        objectType: "Content",
        gradeLevel: ["Class 3"],
        appIcon: "",
        primaryCategory: "eTextbook",
        // Using local sample PDF as fallback when external API fails
        artifactUrl: "https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf",
        contentType: "eTextBook",
        identifier: "do_21374910251798528014586",
        audience: ["Student"],
        visibility: "Default",
        author: "Sample Author",
        mediaType: "content",
        osId: "org.ekstep.quiz.app",
        languageCode: ["en"],
        license: "CC BY 4.0",
        name: "Sample PDF Document",
        status: "Live",
        code: "0534f774-b873-d46d-a46b-bde6a68985dc",
        interceptionPoints: {},
        // Using local sample PDF as fallback when external API fails
        streamingUrl: "https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf",
        medium: ["English"],
        createdOn: "2023-03-13T13:16:54.093+0000",
        lastUpdatedOn: "2023-03-13T13:17:03.060+0000",
        originData: {
            identifier: "do_21374910251798528014586",
            repository: "https://dockstaging.sunbirded.org/api/content/v1/read/do_21374910251798528014586"
        },
        creator: "Sample Creator",
        pkgVersion: 1,
        versionKey: "1678713416428",
        framework: "ekstep_ncert_k-12",
        createdBy: "703f836a-353b-43f4-83fb-b440e7ee9302",
        orgDetails: {
            email: null,
            orgName: "Globe"
        },
        licenseDetails: {
            name: "CC BY 4.0",
            url: "https://creativecommons.org/licenses/by/4.0/legalcode",
            description: "For details see below:"
        }
    },
    data: {}
};

function PdfPlayerDemo() {
    const playerContainerRef:any = useRef(null);

    useEffect(() => {
        // Create the web component element
        const pdfElement = document.createElement('sunbird-pdf-player');

        // Set the player configuration as an attribute
        pdfElement.setAttribute('player-config', JSON.stringify(playerConfig));

        // Add event listeners for player events
        const handlePlayerEvent = (event:any) => {
            console.log('Player Event:', event.detail);
        };

        const handleTelemetryEvent = (event:any) => {
            console.log('Telemetry Event:', event.detail);
        };

        pdfElement.addEventListener('playerEvent', handlePlayerEvent);
        pdfElement.addEventListener('telemetryEvent', handleTelemetryEvent);

        // Append the element to the container
        if (playerContainerRef.current) {
            playerContainerRef.current.innerHTML = '';
            playerContainerRef.current.appendChild(pdfElement);
        }

        // Cleanup function
        return () => {
            if (pdfElement) {
                pdfElement.removeEventListener('playerEvent', handlePlayerEvent);
                pdfElement.removeEventListener('telemetryEvent', handleTelemetryEvent);
                if (playerContainerRef.current && pdfElement.parentNode) {
                    playerContainerRef.current.removeChild(pdfElement);
                }
            }
        };
    }, []);

    return (
        <div style={{
            minHeight: '90vh',
            width: '100%',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <div style={{ height: "80vh" }} ref={playerContainerRef}></div>
        </div>
    );
}

export default PdfPlayerDemo;