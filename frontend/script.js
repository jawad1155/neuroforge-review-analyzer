/* =========================================
   NEUROFORGE
   FRONTEND JAVASCRIPT
========================================= */


/* =========================================
   ANIMATED ENERGY PARTICLES
   No orb
   No rings
   No mouse interaction
========================================= */

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.z = 8;


const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});


renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "-1";
renderer.domElement.style.pointerEvents = "none";


document
    .getElementById("particles")
    .appendChild(renderer.domElement);


/* =========================================
   PARTICLES
========================================= */

const particleCount = 650;

const geometry = new THREE.BufferGeometry();

const positions =
    new Float32Array(
        particleCount * 3
    );


for (let i = 0; i < particleCount; i++) {

    positions[i * 3] =
        (Math.random() - 0.5) * 20;

    positions[i * 3 + 1] =
        (Math.random() - 0.5) * 12;

    positions[i * 3 + 2] =
        (Math.random() - 0.5) * 10;
}


geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
        positions,
        3
    )
);


const material =
    new THREE.PointsMaterial({

        color: 0x8b5cf6,

        size: 0.035,

        transparent: true,

        opacity: 0.65
    });


const particles =
    new THREE.Points(
        geometry,
        material
    );


scene.add(particles);


/* =========================================
   PARTICLE ANIMATION
========================================= */

function animateParticles() {

    requestAnimationFrame(
        animateParticles
    );

    particles.rotation.y += 0.00035;

    particles.rotation.x += 0.00008;

    renderer.render(
        scene,
        camera
    );
}


animateParticles();


/* =========================================
   RESPONSIVE PARTICLES
========================================= */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);


/* =========================================
   CSV UPLOAD
========================================= */

const fileInput =
    document.getElementById(
        "fileInput"
    );

const fileName =
    document.getElementById(
        "fileName"
    );


fileInput.addEventListener(
    "change",
    function () {

        if (
            fileInput.files.length === 0
        ) {

            fileName.textContent =
                "No file selected";

            return;
        }


        const file =
            fileInput.files[0];


        fileName.textContent =
            "Selected file: " +
            file.name;


        /* Read CSV */

        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                const text =
                    event.target.result;


                const lines =
                    text
                        .split(/\r?\n/)
                        .filter(
                            line =>
                                line.trim() !== ""
                        );


                if (lines.length <= 1) {

                    return;
                }


                /*
                    Remove header row
                */

                const rows =
                    lines.slice(1);


                document.getElementById(
                    "totalReviews"
                ).textContent =
                    rows.length.toLocaleString();


                document.getElementById(
                    "datasetBadge"
                ).textContent =
                    file.name;


                /*
                    Show first few reviews
                */

                displayCSVReviews(
                    rows.slice(0, 5)
                );

            };


        reader.readAsText(file);

    }
);


/* =========================================
   DISPLAY CSV REVIEWS
========================================= */

function displayCSVReviews(rows) {

    const reviewsList =
        document.getElementById(
            "reviewsList"
        );


    reviewsList.innerHTML = "";


    rows.forEach(
        (row, index) => {

            /*
                Simple CSV handling.
                Backend will later handle
                proper CSV parsing.
            */

            const columns =
                row.split(",");


            const reviewText =
                columns
                    .slice(1)
                    .join(",")
                    .replace(/^"|"$/g, "");


            const names = [
                "Customer",
                "User",
                "Reviewer",
                "Customer",
                "Buyer"
            ];


            const name =
                names[index] ||
                `Customer ${index + 1}`;


            const review =
                document.createElement(
                    "div"
                );


            review.className =
                "review-row";


            review.innerHTML = `

                <div class="avatar">
                    ${name.charAt(0)}
                </div>

                <div class="review-content">

                    <strong>
                        ${name}
                    </strong>

                    <p>
                        ${reviewText ||
                        "Customer review"}
                    </p>

                </div>

                <div class="stars">
                    ★★★★☆
                </div>

                <div class="sentiment positive-sentiment">
                    Review
                </div>

            `;


            reviewsList.appendChild(
                review
            );

        }
    );
}


/* =========================================
   ASK AI
========================================= */

const askButton =
    document.getElementById(
        "askButton"
    );

const questionInput =
    document.getElementById(
        "question"
    );

const aiAnswer =
    document.getElementById(
        "aiAnswer"
    );


askButton.addEventListener(
    "click",
    askAI
);


function askAI() {

    const question =
        questionInput.value.trim();


    if (question === "") {

        aiAnswer.innerHTML = `

            <div class="ai-answer-box">
                Please enter a question first.
            </div>

        `;

        return;
    }


    /*
        Temporary frontend demo.

        Later this will call:

        Python FastAPI
              ↓
        Gemini AI
              ↓
        Real answer
    */


    aiAnswer.innerHTML = `

        <div class="ai-answer-box">

            <strong>
                ✦ AI Answer
            </strong>

            <br><br>

            Based on the current customer
            feedback, <strong>battery reliability</strong>
            appears to be the first area to improve,
            followed by Bluetooth stability.

            These issues appear repeatedly in
            negative customer feedback.

        </div>

    `;

}


/* =========================================
   ENTER KEY FOR ASK AI
========================================= */

questionInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            askAI();

        }

    }
);
