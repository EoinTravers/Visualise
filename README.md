# Visualise

Assorted data visualisation tools, with a focus on time-course data.
Everything is experimental, and in active developement at this stage,
so use at your own risk.

## Featuring

### Curves

Explore polynomial regression models ("growth curves")
by parsing the coefficients from R output, and plotting
the curves using `d3.js`.
The influence of a specific coefficent can be seen by forcing
it to *not vary*, showing how the curves would look if both
conditions were the same on that term.
Currently doesn't handly orthogonal polynomials well,
but this should change.

[Demo](http://eointravers.github.io/visualise/curves.html)

### Mouse Scatter

Interactive visualisation of raw data from mouse-tracking experiments.
Like a scatterplot, with play/pause buttons, and a slider to explore
at your own pace.

[Demo](http://eointravers.github.io/visualise/scatter.html)

Future versions will allow you to explore your own data online using this tool.
