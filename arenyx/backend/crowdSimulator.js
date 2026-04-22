const { getActionSuggestion, getConcessionOffer } = require('./geminiService');

class CrowdSimulator {
  constructor(io) {
    this.io = io;
    this.gates = [
      { id: '1', name: 'Gate 1', section: 'North', density: 30, status: 'CLEAR', aiAction: null },
      { id: '2', name: 'Gate 2', section: 'North', density: 50, status: 'FILLING', aiAction: null },
      { id: '3', name: 'Gate 3', section: 'East', density: 20, status: 'CLEAR', aiAction: null },
      { id: '4', name: 'Gate 4', section: 'South', density: 80, status: 'CONGESTED', aiAction: null },
      { id: '5', name: 'Gate 5', section: 'West', density: 40, status: 'FILLING', aiAction: null },
      { id: '6', name: 'Gate 6', section: 'VIP', density: 10, status: 'CLEAR', aiAction: null },
    ];
    this.concessions = [
      { id: 'c1', name: 'North Grill', waitTime: 5, status: 'CLEAR', offer: null },
      { id: 'c2', name: 'East Beverage', waitTime: 12, status: 'FILLING', offer: null },
      { id: 'c3', name: 'South Pizza', waitTime: 25, status: 'CONGESTED', offer: null },
      { id: 'c4', name: 'West Tacos', waitTime: 2, status: 'CLEAR', offer: null },
    ];
    this.interval = null;
  }

  start() {
    this.interval = setInterval(() => this.updateDensities(), 5000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  async updateDensities() {
    // GATE SIMULATION
    for (const gate of this.gates) {
      if (gate.status === 'CONGESTED') {
        gate.density -= Math.floor(Math.random() * 5); // subtle decay
      } else {
        const diff = Math.floor(Math.random() * 31) - 15; // -15 to +15
        gate.density = Math.max(5, Math.min(95, gate.density + diff));
      }

      const prevStatus = gate.status;
      if (gate.density < 40) gate.status = 'CLEAR';
      else if (gate.density < 75) gate.status = 'FILLING';
      else gate.status = 'CONGESTED';

      if (prevStatus !== 'CONGESTED' && gate.status === 'CONGESTED') {
         const suggestion = await getActionSuggestion(gate.name, gate.density);
         gate.aiAction = suggestion.staffMsg;
         this.io.emit('ai_suggestion', {
           gateId: gate.id,
           gateName: gate.name,
           attendeeMsg: suggestion.attendeeMsg,
           staffMsg: suggestion.staffMsg,
           type: 'GATE'
         });
      }
      
      if (gate.status === 'CLEAR') gate.aiAction = null;
    }

    // CONCESSION SIMULATION
    for (const stand of this.concessions) {
      if (stand.status === 'CONGESTED') {
         stand.waitTime -= Math.floor(Math.random() * 3); // decay
      } else {
         const diff = Math.floor(Math.random() * 11) - 5; // -5 to +5 mins
         stand.waitTime = Math.max(0, Math.min(45, stand.waitTime + diff));
      }

      const prevStatus = stand.status;
      if (stand.waitTime < 10) stand.status = 'CLEAR';
      else if (stand.waitTime < 20) stand.status = 'FILLING';
      else stand.status = 'CONGESTED';

      if (prevStatus !== 'CONGESTED' && stand.status === 'CONGESTED') {
         const clearStand = this.concessions.find(s => s.status === 'CLEAR');
         const fallbackStandName = clearStand ? clearStand.name : 'another stand';
         
         const offerData = await getConcessionOffer(stand.name, stand.waitTime, fallbackStandName);
         stand.offer = offerData.incentive;
         
         this.io.emit('ai_suggestion', {
           gateId: stand.id,
           gateName: stand.name,
           attendeeMsg: offerData.attendeeMsg,
           staffMsg: offerData.staffMsg,
           type: 'CONCESSION',
           incentive: offerData.incentive
         });
      }

      if (stand.status === 'CLEAR') stand.offer = null;
    }
    
    this.io.emit('crowd_update', { gates: this.gates, concessions: this.concessions });
  }

  markResolved(id, type = 'GATE') {
    if (type === 'GATE') {
      const gate = this.gates.find(g => g.id === id);
      if (gate) {
        gate.density = 30;
        gate.status = 'CLEAR';
        gate.aiAction = null;
      }
    } else {
      const stand = this.concessions.find(c => c.id === id);
      if (stand) {
        stand.waitTime = 5;
        stand.status = 'CLEAR';
        stand.offer = null;
      }
    }
    this.io.emit('crowd_update', { gates: this.gates, concessions: this.concessions });
  }
}

module.exports = CrowdSimulator;
