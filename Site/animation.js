document.addEventListener("DOMContentLoaded", () => {
  // Get references to the SVG elements
  const svg = document.getElementById("face")
  const pupil1 = document.getElementById("pupil-1")
  const pupil2 = document.getElementById("pupil-2")
  const eye1 = document.getElementById("eye-1")

  // Set up blinking for the left eye
  setInterval(() => {
    eye1.classList.add("blinking")
    pupil1.classList.add("blinking")
    setTimeout(() => {
      eye1.classList.remove("blinking")
      pupil1.classList.remove("blinking")
    }, 300)
  }, 5000)

  // Get the SVG's bounding box for calculations
  const svgRect = svg.getBoundingClientRect()

  // Maximum movement range for pupils
  const maxMove = 3

  // Track mouse movement
  document.addEventListener("mousemove", (e) => {
    // Get the bounding rectangle of the SVG
    const svgRect = document.getElementById("face").getBoundingClientRect();
  
    // Calculate mouse position relative to the SVG center
    const mouseX = e.clientX - svgRect.left - svgRect.width / 2;
    const mouseY = e.clientY - svgRect.top - svgRect.height / 2;
  
    // Calculate movement percentage (distance from center)
    const moveX = (mouseX / (svgRect.width / 2)) * maxMove;
    const moveY = (mouseY / (svgRect.height / 2)) * maxMove;
  
    // Calculate new positions for the pupils
    const pupil1X = 60 + moveX; // Assuming the center of the first eye is at (100, 100)
    const pupil1Y = 80 + moveY; // Adjust based on the eye's vertical position
  
    const pupil2X = 120 + moveX; // Assuming the center of the second eye is at (160, 100)
    const pupil2Y = 70 + moveY; // Adjust based on the eye's vertical position
  
    // Set the new positions for the pupils
    pupil1.setAttribute("x", pupil1X);
    pupil1.setAttribute("y", pupil1Y);
    
    pupil2.setAttribute("x", pupil2X);
    pupil2.setAttribute("y", pupil2Y);
  });
  
})
