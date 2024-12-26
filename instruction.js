export const mockTestInstructions = {
    html: {
        title: "Task Instructions",
        duration: "30 Minutes",  // Added the duration property here
        overview: "General Instructions: Use proper indentation and comments. All requested features must be correctly present in the code.",
        sections: [
            {
                title: "Beginner Level (25 points)",
                items: [
                    "(5 points) Basic Page Structure: Create an HTML with title, heading.",
                    "(5 points) Paragraphs and Text Formatting: Add paragraphs, bold and italic text.",
                    "(5 points) Unordered List: Add an unordered list with 3 items.",
                    "(5 points) Adding an Image: Add a placeholder image using <img> tag with alt text.",
                    "(5 points) Simple Link: Add a link that goes to https://www.example.com with text 'visit example'."
                ]
            },
            {
                title: "Intermediate Level (35 points)",
                items: [
                    "(10 points) Table Structure: Create a table with headers and data rows.",
                    "(5 points) Ordered List: Add an ordered list with at least four list items.",
                    "(10 points) Semantic Structure: Use semantic elements like nav, article, and aside.",
                    "(10 points) Embedding an Iframe: Add an iframe with w3school page and specify height and width."
                ]
            },
            {
                title: "Advanced Level (40 points)",
                items: [
                    "(15 points) HTML Form: Create a form with text, email, and number fields and submit button.",
                    "(10 points) Audio Element: Add an audio element with a sample URL using the audio tag.",
                    "(5 points) Data Attributes: Add a data attribute to the main section.",
                    "(10 points) SVG and Canvas: Add an SVG circle element and a canvas with a JS comment."
                ]
            }
        ]
    }
};