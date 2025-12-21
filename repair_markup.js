const fs = require('fs');

try {
    const content = fs.readFileSync('index.html', 'utf8');
    const lines = content.split('\n');

    // Find the second DOCTYPE (nested file start)
    let startIndex = -1;
    let foundFirst = false;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('<!DOCTYPE html>')) {
            if (foundFirst) {
                startIndex = i;
                break;
            }
            foundFirst = true;
        }
    }

    if (startIndex !== -1) {
        console.log(`Found nested HTML starting at line ${startIndex + 1}`);

        // Extract lines from startIndex to end
        const newLines = lines.slice(startIndex);

        // Unindent
        // Determine indentation of the FIRST line (the doctype usually isn't indented much, but the HTML tag is)
        // Let's check the indentation of the <html> tag (next line typically) or just Regex remove leading spaces

        const cleanedLines = newLines.map(line => {
            // Remove up to 28-32 spaces of indentation? 
            // Better: trimLeft? No, that ruins pre-formatted text if any.
            // But HTML ignores whitespace mostly.
            // Let's try to detect common indentation.
            // The file view shows: line 79: "                            <html..."
            // It looks like ~28 spaces.

            // Safe approach: Remove leading whitespace if it matches the pattern of the block.
            // Or just regex replace ^\s+ with ''? No, that flattens everything.

            return line.replace(/^\s{28}/, ''); // Try removing 28 spaces specifically?
        });

        // Actually, let's just use a smarter unindent.
        // Find the indent of the line with '<html'
        let indent = '';
        for (let l of newLines) {
            if (l.includes('<html')) {
                const match = l.match(/^(\s+)<html/);
                if (match) indent = match[1];
                break;
            }
        }

        console.log(`Detected indentation: ${indent.length} chars`);

        const finalLines = newLines.map(line => {
            if (line.startsWith(indent)) {
                return line.substring(indent.length);
            } else {
                // If it has less indent, just trim start? or keep as is?
                return line.trim(); // Most safe for root elements
            }
        });

        fs.writeFileSync('index.html', finalLines.join('\n'), 'utf8');
        console.log("File repaired successfully.");

    } else {
        console.log("Could not find nested DOCTYPE. File might be fine or structure matches expectations.");
    }

} catch (e) {
    console.error("Error:", e);
}
