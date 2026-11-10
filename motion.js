(function () {
    const canvas = document.querySelector('.node-field');
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const pointer = { x: -1000, y: -1000, active: false };
    const pulses = [];
    let nodes = [];
    let width = 0;
    let height = 0;
    let frameId;

    function resize() {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        createNodes();
    }

    function createNodes() {
        const count = Math.max(18, Math.min(48, Math.floor((width * height) / 26000)));
        nodes = Array.from({ length: count }, function () {
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.18,
                vy: (Math.random() - 0.5) * 0.18,
                radius: Math.random() * 1.7 + 1
            };
        });
    }

    function draw() {
        context.clearRect(0, 0, width, height);
        nodes.forEach(function (node) {
            const distanceX = pointer.x - node.x;
            const distanceY = pointer.y - node.y;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            if (pointer.active && distance < 170) {
                node.vx -= distanceX * 0.000018;
                node.vy -= distanceY * 0.000018;
            }
            node.x += node.vx;
            node.y += node.vy;
            if (node.x < -20 || node.x > width + 20) node.vx *= -1;
            if (node.y < -20 || node.y > height + 20) node.vy *= -1;
        });

        nodes.forEach(function (node, index) {
            nodes.slice(index + 1).forEach(function (other) {
                const distanceX = node.x - other.x;
                const distanceY = node.y - other.y;
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                if (distance < 145) {
                    context.strokeStyle = 'rgba(11, 11, 11, ' + (0.15 * (1 - distance / 145)) + ')';
                    context.lineWidth = 1;
                    context.beginPath();
                    context.moveTo(node.x, node.y);
                    context.lineTo(other.x, other.y);
                    context.stroke();
                }
            });
            context.fillStyle = 'rgba(11, 11, 11, 0.4)';
            context.beginPath();
            context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            context.fill();
        });

        pulses.forEach(function (pulse, index) {
            pulse.radius += 2.4;
            pulse.opacity -= 0.018;
            context.strokeStyle = 'rgba(11, 11, 11, ' + Math.max(pulse.opacity, 0) + ')';
            context.lineWidth = 1;
            context.beginPath();
            context.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
            context.stroke();
            if (pulse.opacity <= 0) pulses.splice(index, 1);
        });
        frameId = window.requestAnimationFrame(draw);
    }

    function updatePointer(event) {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.active = true;
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', updatePointer, { passive: true });
    window.addEventListener('pointerleave', function () { pointer.active = false; });
    window.addEventListener('click', function (event) {
        if (event.target.closest('a, button, input')) return;
        pulses.push({ x: event.clientX, y: event.clientY, radius: 4, opacity: 0.35 });
    });

    resize();
    draw();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.cancelAnimationFrame(frameId);
        context.clearRect(0, 0, width, height);
    }
}());