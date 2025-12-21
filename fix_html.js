const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
const startMarker = '<div class="form-actions sticky-footer">';
// We look for a unique string that is definitely AFTER the corruption but inside the block
const endMarker = 'Guardar Orden</button>';

const startIndex = content.indexOf(startMarker);
// We search for endMarker starting from startIndex
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    // Find the closing div after the button
    const divClose = content.indexOf('</div>', endIndex);

    if (divClose !== -1) {
        const newBlock = `<div class="form-actions sticky-footer">
                    <button type="button" class="btn-cancel" onclick="app.navigateTo('dashboard')">Cancelar</button>
                    <button type="button" id="btn-download" class="btn-secondary" style="display:none; justify-content: center; align-items: center; gap: 5px;">
                        <span class="material-symbols-outlined">download</span> Img
                    </button>
                    <button type="button" id="btn-share" class="btn-secondary" style="display:none; justify-content: center; align-items: center; gap: 5px;">
                        <span class="material-symbols-outlined">share</span> Enviar
                    </button>
                    <button type="submit" class="btn-save" style="display: flex; justify-content: center; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined">save</span> Guardar Orden
                    </button>
                </div>`;

        // Construct new content
        // startIndex is the beginning of the old block
        // divClose + 6 is the end of '</div>'
        const finalContent = content.substring(0, startIndex) + newBlock + content.substring(divClose + 6);

        fs.writeFileSync('index.html', finalContent, 'utf8');
        console.log("Successfully replaced corrupted button block.");
    } else {
        console.log("Error: Could not find closing div.");
    }
} else {
    console.log("Error: Could not find start or end markers.");
    console.log("Start Index:", startIndex);
    console.log("End Marker Index:", endIndex);
}
