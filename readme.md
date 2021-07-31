# Notes

The /Page object must contain an array of /Contents referencing all the objects that need to be rendered.

The << /Length 53 >> of an object informs the render system how many bytes are expected between stream and endstream (starts at 0).

## Challenges

Calculating right aligned text requires us to know the width of each glyph width of each character on the line. Since we don't/won't be using mono spaced fonts the width will vary between each glyph. Something like [fontkit](https://github.com/foliojs/fontkit) might be useful, see (widthOfGlyph method)[https://github.com/foliojs/fontkit#fontwidthofglyphglyph_id]

PDFs don't have the ability to align text. New lines can be created with T* after a line height (TL) has been set, however, new lines are left-aligned. If we want to center align text we need to render the additional lines across several objects.