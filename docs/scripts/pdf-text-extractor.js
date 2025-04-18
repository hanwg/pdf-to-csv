/**
 * Asynchronously extracts all text content from a PDF file using PDF.js.
 *
 * @param {string | File} source - The URL of the PDF file or a File object.
 * @returns {Promise<string>} - A promise that resolves with the extracted text content, or rejects with an error.
 */
async function readTextFromPdf(source) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs';

    try {
        let loadingTask = pdfjsLib.getDocument({
            data: await source.arrayBuffer()
        });

        const pdfDocument = await loadingTask.promise;
        let lines = [];

        // save in global
        window.pdf = {
            doc: pdfDocument,
            pages: [],
            numPages: pdfDocument.numPages
        };

        // Iterate over each page of the PDF.
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const textLayer = await page.getTextContent();

            window.pdf.pages.push(page);
            if (pageNum == 1) {
                document.getElementById("pageContainer").style.border = 'solid 1px #ccc';

                await render(page);

                var elements = document.getElementsByClassName("role");
                for (var i = 0; i < elements.length; i++) {
                    var attribute = elements[i].getAttribute("role");
                    //TODO
                    //elements[i].addEventListener('click', myFunction, false);
                }

                // TODO refactor this
                document.getElementById("selectPdf").style.display = 'none';
                document.getElementById("selectHeaders").style.display = 'block';
            }

            // Concatenate the text from each item in the text layer.
            let line = [];
            let xTranslation = 0;
            for (const item of textLayer.items) {
                if (item.transform[4] >= xTranslation) {
                    xTranslation = item.transform[4];
                    line.push(item);
                } else {
                    // new line
                    lines.push(line);
                    line = [];
                    xTranslation = item.transform[4];
                }
            }debugger
            await page.cleanup(); //release page resources
        }
// TODO await pdfDocument.cleanup(); //release document resources

        return lines;
    } catch (error) {
        console.error('Error reading PDF:', error);
        throw error; // Re-throw the error to be caught by the caller.
    }
}

async function exampleUsage() {
    const fileInput = document.getElementById('file-input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const lines = await readTextFromPdf(file);
                for (const line of lines) {
                    var str = '';
                    for (const textElement of line) {
                        str = str + textElement.str + '|';
                    }
                    console.log(str);
                }
                //console.log('Text from file:', text);
            } catch (err) {
                console.error('Failed to extract text from file', err);
            }
        }
    };
}

async function render(page) {
    const scale = 1;
    const viewport = page.getViewport({ scale: scale });

    const container = document.getElementById("pageContainer");
    const eventBus = new pdfjsViewer.EventBus();
    const pdfPageView = new pdfjsViewer.PDFPageView({
        container,
        id: 1, //TODO page number
        scale: scale,
        defaultViewport: viewport,
        eventBus
    });

    // Associate the actual page with the view, and draw it.
    pdfPageView.setPdfPage(page);
    pdfPageView.draw();
}

exampleUsage();