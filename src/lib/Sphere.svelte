<script>
  let isHovered = false;
  
  function handleMouseMove(event) {
    if (!isHovered) return;
    const sphere = event.currentTarget;
    const rect = sphere.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const angleX = (y - centerY) / 20;
    const angleY = (x - centerX) / 20;
    
    sphere.style.transform = `rotateX(${-angleX}deg) rotateY(${angleY}deg)`;
  }
</script>

<div 
  class="sphere"
  on:mousemove={handleMouseMove}
  on:mouseenter={() => isHovered = true}
  on:mouseleave={() => {
    isHovered = false;
    event.currentTarget.style.transform = 'rotateX(0) rotateY(0)';
  }}
>
  <div class="lines"></div>
</div>

<style>
  .sphere {
    width: 200px;
    height: 200px;
    background: #feffaf;
    border-radius: 50%;
    transition: transform 0.1s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .lines {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.05) 2px,
      rgba(0, 0, 0, 0.05) 4px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.05) 2px,
      rgba(0, 0, 0, 0.05) 4px
    );
  }

  .sphere:hover {
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }
</style>