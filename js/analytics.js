// Datos de la tabla original
const transportData = {
    providers: [
        {
            name: 'Tacoha',
            representative: 'Jorge Martinez',
            commission: 20,
            status: 'R',
            routes: [
                {
                    code: 'ABC123',
                    route: 'Santiago - Viña del Mar',
                    pricePerKm: 1380,
                    avgSeatPrice: 5600,
                    kmOffered: 233200,
                    kmSold: 123430,
                    occupancy: 53,
                    passengers: 6523,
                    totalRevenue: 2350000,
                    commission: 470000,
                    netPayment: 1880000
                },
                {
                    code: 'XYZ456',
                    route: 'Valparaíso - Santiago',
                    pricePerKm: 900,
                    avgSeatPrice: 4300,
                    totalRevenue: 1560000,
                    commission: 312000,
                    netPayment: 1248000
                },
                {
                    code: 'MNC789',
                    route: 'Iquique - Arica',
                    pricePerKm: 876,
                    avgSeatPrice: 6100,
                    totalRevenue: 2100000,
                    commission: 420000,
                    netPayment: 1680000
                }
            ]
        },
        {
            name: 'Traveltur',
            representative: 'Rodrigo Muñoz',
            commission: 15,
            status: 'T',
            routes: [
                {
                    code: 'ABC123',
                    route: 'Santiago - Valdivia',
                    pricePerKm: 1380,
                    avgSeatPrice: 5600,
                    kmOffered: 233200,
                    kmSold: 123430,
                    occupancy: 53,
                    passengers: 6523,
                    totalRevenue: 2350000,
                    commission: 470000,
                    netPayment: 1880000
                },
                {
                    code: 'XYZ456',
                    route: 'Valparaíso - La Serena',
                    pricePerKm: 900,
                    avgSeatPrice: 4300,
                    totalRevenue: 1560000,
                    commission: 312000,
                    netPayment: 1248000
                },
                {
                    code: 'MNC789',
                    route: 'Iquique - Calama',
                    pricePerKm: 876,
                    avgSeatPrice: 6100,
                    totalRevenue: 2100000,
                    commission: 420000,
                    netPayment: 1680000
                }
            ]
        }
    ]
};

// Variables globales para los gráficos
let charts = {};
let currentFilter = 'all';

// Configuración de colores
const colors = {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#28a745', '#20c997'],
    accent: ['#ffc107', '#fd7e14'],
    danger: ['#dc3545', '#e83e8c']
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    updateStats();
    populateRouteTable();
    animateStatCards();
});

function initializeCharts() {
    createRevenueChart();
    createCommissionChart();
    createRoutePerformanceChart();
    createOccupancyChart();
    createNetPaymentChart();
}

function createRevenueChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    const providerRevenues = transportData.providers.map(provider => 
        provider.routes.reduce((sum, route) => sum + route.totalRevenue, 0)
    );

    charts.revenue = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: transportData.providers.map(p => p.name),
            datasets: [{
                data: providerRevenues,
                backgroundColor: [
                    'linear-gradient(135deg, #667eea, #764ba2)',
                    'linear-gradient(135deg, #28a745, #20c997)'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            return context.label + ': $' + value.toLocaleString('es-CL');
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                duration: 2000
            }
        }
    });
}

function createCommissionChart() {
    const ctx = document.getElementById('commissionChart').getContext('2d');
    
    const commissionData = transportData.providers.map(provider => ({
        name: provider.name,
        percentage: provider.commission,
        total: provider.routes.reduce((sum, route) => sum + route.commission, 0)
    }));

    charts.commission = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: commissionData.map(d => d.name),
            datasets: [{
                label: 'Porcentaje de Comisión',
                data: commissionData.map(d => d.percentage),
                backgroundColor: ['rgba(102, 126, 234, 0.8)', 'rgba(40, 167, 69, 0.8)'],
                borderColor: ['#667eea', '#28a745'],
                borderWidth: 2,
                borderRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 25,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutBounce'
            }
        }
    });
}

function createRoutePerformanceChart() {
    const ctx = document.getElementById('routePerformanceChart').getContext('2d');
    
    const allRoutes = [];
    transportData.providers.forEach(provider => {
        provider.routes.forEach(route => {
            allRoutes.push({
                label: `${route.route} (${provider.name})`,
                revenue: route.totalRevenue,
                netPayment: route.netPayment,
                provider: provider.name
            });
        });
    });

    charts.routePerformance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allRoutes.map(r => r.label),
            datasets: [
                {
                    label: 'Recaudación Total',
                    data: allRoutes.map(r => r.revenue),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                },
                {
                    label: 'Pago Neto',
                    data: allRoutes.map(r => r.netPayment),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#28a745',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000000).toFixed(1) + 'M';
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function createOccupancyChart() {
    const ctx = document.getElementById('occupancyChart').getContext('2d');
    
    const occupancyData = transportData.providers.map(provider => {
        const routesWithOccupancy = provider.routes.filter(route => route.occupancy);
        const avgOccupancy = routesWithOccupancy.length > 0 
            ? routesWithOccupancy.reduce((sum, route) => sum + route.occupancy, 0) / routesWithOccupancy.length 
            : 0;
        return {
            name: provider.name,
            occupancy: avgOccupancy
        };
    });

    charts.occupancy = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: occupancyData.map(d => d.name),
            datasets: [{
                data: occupancyData.map(d => d.occupancy),
                backgroundColor: [
                    'rgba(102, 126, 234, 0.7)',
                    'rgba(40, 167, 69, 0.7)'
                ],
                borderColor: ['#667eea', '#28a745'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            animation: {
                duration: 2000
            }
        }
    });
}

function createNetPaymentChart() {
    const ctx = document.getElementById('netPaymentChart').getContext('2d');
    
    const netPayments = transportData.providers.map(provider => 
        provider.routes.reduce((sum, route) => sum + route.netPayment, 0)
    );

    charts.netPayment = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: transportData.providers.map(p => p.name),
            datasets: [{
                label: 'Pago Neto',
                data: netPayments,
                backgroundColor: [
                    'linear-gradient(135deg, #667eea, #764ba2)',
                    'linear-gradient(135deg, #28a745, #20c997)'
                ],
                borderRadius: 10,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000000).toFixed(1) + 'M';
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutBounce'
            }
        }
    });
}

function updateStats() {
    const totalRevenue = transportData.providers.reduce((sum, provider) => 
        sum + provider.routes.reduce((routeSum, route) => routeSum + route.totalRevenue, 0), 0
    );
    
    const totalCommission = transportData.providers.reduce((sum, provider) => 
        sum + provider.routes.reduce((routeSum, route) => routeSum + route.commission, 0), 0
    );
    
    const totalNetPayment = transportData.providers.reduce((sum, provider) => 
        sum + provider.routes.reduce((routeSum, route) => routeSum + route.netPayment, 0), 0
    );
    
    const routesWithOccupancy = [];
    transportData.providers.forEach(provider => {
        provider.routes.forEach(route => {
            if (route.occupancy) routesWithOccupancy.push(route.occupancy);
        });
    });
    
    const avgOccupancy = routesWithOccupancy.length > 0 
        ? routesWithOccupancy.reduce((sum, occ) => sum + occ, 0) / routesWithOccupancy.length 
        : 0;

    animateValue('totalRevenue', totalRevenue, '$', true);
    animateValue('totalCommission', totalCommission, '$', true);
    animateValue('netPayment', totalNetPayment, '$', true);
    animateValue('avgOccupancy', avgOccupancy, '%');
}

function animateValue(elementId, finalValue, suffix = '', isCurrency = false) {
    const element = document.getElementById(elementId);
    const duration = 2000;
    const startTime = Date.now();
    const startValue = 0;

    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = startValue + (finalValue - startValue) * easeOutQuart(progress);

        if (isCurrency) {
            element.textContent = suffix + Math.floor(currentValue).toLocaleString('es-CL');
        } else {
            element.textContent = Math.floor(currentValue) + suffix;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    
    update();
}

function easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
}

function populateRouteTable() {
    const tbody = document.getElementById('routeTableBody');
    tbody.innerHTML = '';
    
    transportData.providers.forEach(provider => {
        provider.routes.forEach(route => {
            const row = document.createElement('tr');
            const efficiency = route.occupancy || 0;
            let efficiencyClass = 'efficiency-medium';
            
            if (efficiency > 70) {
                efficiencyClass = 'efficiency-high';
            } else if (efficiency < 40) {
                efficiencyClass = 'efficiency-low';
            }
            
            row.innerHTML = `
                <td>${route.route}</td>
                <td>${provider.name}</td>
                <td>$${route.totalRevenue.toLocaleString('es-CL')}</td>
                <td>${route.occupancy || 'N/A'}%</td>
                <td><span class="efficiency-indicator ${efficiencyClass}">${efficiency}%</span></td>
                <td>$${route.netPayment.toLocaleString('es-CL')}</td>
            `;
            
            tbody.appendChild(row);
        });
    });
}

function animateStatCards() {
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });
}

function filterData(filter) {
    currentFilter = filter;
    
    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.textContent.toLowerCase().includes(filter) || (filter === 'all' && btn.textContent.toLowerCase() === 'todos')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Aquí puedes implementar la lógica de filtrado si es necesario
    console.log('Filtrando por:', filter);
    
    // Actualizar los gráficos según el filtro
    updateCharts();
}

function updateCharts() {
    // Aquí puedes implementar la actualización de gráficos según el filtro
    // Por ahora solo actualizamos la tabla de rutas
    populateRouteTable();
}
