// app.js

// 1) Define a custom event to assign levels and specialized markers.
Highcharts.addEvent(Highcharts.Series, 'afterSetOptions', function (e) {
  // Only apply if it's our 'musk-network' series of type networkgraph:
  if (
    this instanceof Highcharts.Series.types.networkgraph &&
    e.options.id === 'musk-network'
  ) {
    const colors = Highcharts.getOptions().colors || ['#7cb5ec', '#434348'];
    const nodes = {};

    // -- Node sizes --
    const peopleNodeSize = 20;
    const connectionNodeSize = 32; // ~1.6 * 20
    const governmentRoleSize = 48; // ~2.4 * 20
    const elonMuskNodeSize = 72;   // e.g. 1.5 * 48

    // Images for connections, gov roles, and people
    const connectionImagePaths = {
      Tesla: 'images/tesla.png',
      SpaceX: 'images/spacex.png',
      'Boring Company': 'images/boringcompany.png',
      X: 'images/x.png',
      'Musk Foundation': 'images/muskfoundation.png',
      Backer: 'images/back.png',
      xAI: 'images/xai.png',
      'X Banker': 'images/x.png',
      'Twitter Banker': 'images/x.png'
    };
    const governmentImagePaths = {
      DOGE: 'images/govlogo/doge.png',
      'Social Security Administration': 'images/govlogo/socialsecurityadministration.svg.png',
      'Veterans Affairs': 'images/govlogo/veteransaffairs.svg.png',
      'Office of Personnel Management': 'images/govlogo/officeofpersonnelmanagement.png',
      'Federal Bureau of Investigation': 'images/govlogo/federalbureauofinvestigation.png',
      NASA: 'images/govlogo/nasa.png',
      'US Citizenship and Immigration Services': 'images/govlogo/uscitizenshipandimmigrationservices.png',
      'Department of Education': 'images/govlogo/departmentofeducation.png',
      'Department of Labor': 'images/govlogo/departmentoflabor.png',
      'Department of Energy': 'images/govlogo/departmentofenergy.png',
      'Department of Health and Human Services': 'images/govlogo/departmentofhealthandhumanservices.png',
      'Department of Treasury': 'images/govlogo/departmentoftreasury.png',
      'Department of Commerce': 'images/govlogo/departmentofcommerce.png',
      'General Services Administration': 'images/govlogo/officeofpersonnelmanagement.png'
    };
    const peopleImagePaths = {
      'Person:Antonio Gracias': 'images/peoplelogo/Antonio Gracias.jpg',
      'Person:Joe Gebbia': 'images/peoplelogo/Joe Gebbia.jpg',
      'Person:Michael Grimes': 'images/peoplelogo/Michael Grimes.jpg',
      'Person:Steve Davis': 'images/peoplelogo/Steve Davis.jpg',
      'Person:Jared Isaacman': 'images/peoplelogo/Jared Isaacman.jpg'
    };

    // -- Elon Musk in center (level 0) --
    nodes['Elon Musk'] = {
      id: 'Elon Musk',
      marker: {
        radius: elonMuskNodeSize,
        symbol: 'url(images/elonmusk.jpg)',
        width: elonMuskNodeSize * 2,
        height: elonMuskNodeSize * 2
      },
      dataLabels: { style: { fontSize: '16px', fontWeight: 'bold' } },
      // Keep him in place
      fixed: true,
      x: 0,
      y: 0,
      level: 0
    };

    // -- Find all connection types (level 1) from data array --
    const connectionsSet = new Set();
    e.options.data.forEach(link => {
      if (link[0] === 'Elon Musk') {
        connectionsSet.add(link[1]);
      }
    });
    let colorIndex = 0;
    connectionsSet.forEach(connection => {
      const image = connectionImagePaths[connection] || null;
      const symbolUrl = image ? `url(${image})` : 'circle';
      nodes[connection] = {
        id: connection,
        marker: {
          radius: connectionNodeSize,
          symbol: symbolUrl,
          width: connectionNodeSize * 1.6,
          height: connectionNodeSize * 1.6
        },
        color: colors[colorIndex++ % colors.length],
        dataLabels: { style: { fontSize: '12px', fontWeight: 'bold' } },
        level: 1
      };
    });

    // -- People (level 2) --
    e.options.data.forEach(link => {
      if (link[0].startsWith('Person:') && !nodes[link[0]]) {
        const id = link[0];
        const img = peopleImagePaths[id] || 'images/peoplelogo/people.jpg';
        nodes[id] = {
          id,
          name: id.replace('Person:', ''),
          marker: {
            radius: peopleNodeSize * 1.4,
            symbol: `url(${img})`,
            width: peopleNodeSize * 2,
            height: peopleNodeSize * 2
          },
          color: '#666666',
          dataLabels: { style: { fontSize: '10px' } },
          level: 2
        };
      }
    });

    // -- Gov roles (level 3) --
    e.options.data.forEach(link => {
      if (link[1] && governmentImagePaths[link[1]] && !link[1].startsWith('Person:') && !nodes[link[1]]) {
        const img = governmentImagePaths[link[1]] || null;
        const sym = img ? `url(${img})` : 'square';
        nodes[link[1]] = {
          id: link[1],
          marker: {
            radius: governmentRoleSize,
            symbol: sym,
            width: governmentRoleSize * 1.6,
            height: governmentRoleSize * 1.6
          },
          level: 3
        };
      }
    });

    // Convert our nodes object to an array
    e.options.nodes = Object.keys(nodes).map(key => nodes[key]);
  }
});

// 2) Load data.json, build link array, then create the chart
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    const links = [];
    const personDescriptions = {};

    // Create connection maps for easier relationship management
    const connectionsMap = new Map(); // Maps connections to people
    const peopleRolesMap = new Map(); // Maps people to their government roles

    data.forEach(person => {
      const personNode = `Person:${person.name}`;
      personDescriptions[personNode] = person.description || 'No description';

      // 1. Gather all muskConnection fields
      const conns = [];
      if (person.muskConnection) conns.push(person.muskConnection);
      for (let i = 1; i <= 5; i++) {
        const key = `muskConnection_${i}`;
        if (person[key]) conns.push(person[key]);
      }

      // 2. Gather all governmentRole fields
      const roles = [];
      if (person.governmentRole) roles.push(person.governmentRole);
      for (let i = 1; i <= 5; i++) {
        const key = `governmentRole_${i}`;
        if (person[key]) roles.push(person[key]);
      }

      // 3. Store the relations
      conns.forEach(conn => {
        if (!connectionsMap.has(conn)) {
          connectionsMap.set(conn, []);
        }
        connectionsMap.get(conn).push(personNode);
      });

      peopleRolesMap.set(personNode, roles);
    });

    // 4. Create links based on the requested structure:
    // Elon Musk → MuskConnection → People → GovernmentRole

    // a. Elon Musk to all connections
    for (const connection of connectionsMap.keys()) {
      links.push(['Elon Musk', connection]);
    }

    // b. Connections to People
    for (const [connection, people] of connectionsMap.entries()) {
      people.forEach(person => {
        links.push([connection, person]);
      });
    }

    // c. People to Government Roles
    for (const [person, roles] of peopleRolesMap.entries()) {
      roles.forEach(role => {
        links.push([person, role]);
      });
    }

    // Expose for tooltips
    window.personDescriptions = personDescriptions;

    // 3) Create the chart
    Highcharts.chart('container', {
      chart: {
        type: 'networkgraph',
        // Ensure container has a real size in CSS (e.g., 1000×800).
        height: 800
      },
      title: {
        text: "Elon Musk's DOGE Recruits Network",
        align: 'left'
      },
      subtitle: {
        text: 'Hierarchical view: Musk → Companies → People → Government Roles',
        align: 'left'
      },
      plotOptions: {
        networkgraph: {
          keys: ['from', 'to'],
          draggable: true,
          // Let user drag
          dragDrop: { draggableX: true, draggableY: true },
          layoutAlgorithm: {
            enableSimulation: true,
            // Positive friction so nodes don't fling out:
            friction: 0.9,
            // Very low or zero gravity if you don't want them pulled center:
            gravitationalConstant: 0.001,
            integration: 'verlet',
            linkLength: 160,
            // Distribute nodes by level in concentric circles:
            beforeLayout: function() {
              const chart = this.series[0].chart;
              
              // These are the actual inner plot dimensions:
              const centerX = chart.plotLeft + chart.plotWidth / 2;
              const centerY = chart.plotTop + chart.plotHeight / 2;

              const nodes = this.nodes;
              // Pick suitable ring radius per level
              const ring = { 0: 0, 1: 150, 2: 300, 3: 450 };
              
              // Group by level
              const byLevel = {};
              nodes.forEach(nd => {
                const level = nd.options.level !== undefined ? nd.options.level : 3;
                if (!byLevel[level]) byLevel[level] = [];
                byLevel[level].push(nd);
              });

              Object.keys(byLevel).forEach(lvlStr => {
                const lvl = parseInt(lvlStr, 10);
                const nArr = byLevel[lvl];
                if (lvl === 0) {
                  // Elon Musk in the center
                  nArr.forEach(n => {
                    n.plotX = centerX;
                    n.plotY = centerY;
                    // Highcharts uses "fixedPosition" for pinned nodes
                    n.fixedPosition = { x: centerX, y: centerY };
                  });
                } else {
                  const radius = ring[lvl] || lvl * 150;
                  const count = nArr.length;
                  const angleStep = (2 * Math.PI) / count;
                  nArr.forEach((node, idx) => {
                    const angle = idx * angleStep + (lvl * 0.15);
                    const jitter = Math.random() * 20 - 10;
                    const r2 = radius + jitter;
                    node.plotX = centerX + r2 * Math.cos(angle);
                    node.plotY = centerY + r2 * Math.sin(angle);
                    node.fixedPosition = null; // let it move under simulation
                  });
                }
              });
            }
          },
          events: {
            drag: function(e) {
              // Continuously fix the new position while dragging
              e.point.fixedPosition = { x: e.point.plotX, y: e.point.plotY };
              if (this.layout.updateLinks) {
                this.layout.updateLinks();
              }
            },
            dragEnd: function(e) {
              // Stop the simulation so the node stays where you drop it
              if (this.layout && this.layout.simulation && this.layout.simulation.running) {
                this.layout.simulation.stop();
              }
            }
          }
        }
      },
      tooltip: {
        useHTML: true,
        formatter: function() {
          if (this.point.id.startsWith('Person:')) {
            const personName = this.point.id.replace('Person:', '');
            return `<b>${personName}</b><br>${window.personDescriptions[this.point.id] || 'No description'}`;
          }
          return this.point.id;
        }
      },
      series: [{
        accessibility: { enabled: false },
        dataLabels: {
          enabled: true,
          linkFormat: '',
          allowOverlap: false,
          formatter: function() {
            // For people, remove the "Person:" prefix
            return this.point.id.startsWith('Person:')
              ? this.point.id.replace('Person:', '')
              : this.point.id;
          },
          style: { fontSize: '10px' }
        },
        id: 'musk-network',
        // The links array we built from data
        data: links
      }]
    });
  })
  .catch(err => console.error('Error loading data:', err));