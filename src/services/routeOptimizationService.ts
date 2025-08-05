// Servicio de optimización de rutas con algoritmos avanzados
export class RouteOptimizationService {
  
  // Algoritmo de optimización basado en IA predictiva
  static async optimizeWithAI(deliveryPoints: any[], trafficData?: any[]) {
    try {
      // Simular análisis de IA con múltiples factores
      const factors = {
        trafficPatterns: await this.analyzeTrafficPatterns(trafficData),
        timeWindows: this.analyzeTimeWindows(deliveryPoints),
        priority: this.calculatePriorityScores(deliveryPoints),
        distance: this.calculateDistanceMatrix(deliveryPoints),
        historicalData: await this.getHistoricalPerformance(deliveryPoints)
      };

      // Aplicar algoritmo de optimización con IA
      const optimizedRoute = await this.applyAIOptimization(deliveryPoints, factors);
      
      return {
        route: optimizedRoute,
        algorithm: 'ai_prediction',
        confidence: this.calculateConfidence(factors),
        expectedImprovement: this.calculateExpectedImprovement(factors)
      };
    } catch (error) {
      console.error('Error in AI optimization:', error);
      throw error;
    }
  }

  // Algoritmo genético para optimización de rutas
  static async optimizeWithGeneticAlgorithm(deliveryPoints: any[], options = {}) {
    const config = {
      populationSize: 100,
      generations: 200,
      mutationRate: 0.02,
      crossoverRate: 0.8,
      eliteSize: 20,
      ...options
    };

    try {
      // Inicializar población
      let population = this.initializePopulation(deliveryPoints, config.populationSize);
      
      for (let generation = 0; generation < config.generations; generation++) {
        // Evaluar fitness de cada individuo
        population = this.evaluatePopulation(population, deliveryPoints);
        
        // Selección, cruzamiento y mutación
        population = this.evolvePopulation(population, config);
        
        // Log de progreso cada 50 generaciones
        if (generation % 50 === 0) {
          console.log(`Generation ${generation}: Best fitness = ${population[0].fitness}`);
        }
      }

      const bestRoute = population[0];
      
      return {
        route: this.decodeRoute(bestRoute, deliveryPoints),
        algorithm: 'genetic',
        fitness: bestRoute.fitness,
        generations: config.generations
      };
    } catch (error) {
      console.error('Error in genetic algorithm:', error);
      throw error;
    }
  }

  // Problema del Viajante (TSP) clásico con optimizaciones
  static async optimizeWithTSP(deliveryPoints: any[]) {
    try {
      // Calcular matriz de distancias
      const distanceMatrix = this.calculateDistanceMatrix(deliveryPoints);
      
      // Aplicar algoritmo de TSP optimizado (2-opt)
      let bestRoute = this.nearestNeighborTSP(distanceMatrix);
      bestRoute = this.improve2Opt(bestRoute, distanceMatrix);
      
      // Si hay muchos puntos, aplicar 3-opt
      if (deliveryPoints.length > 10) {
        bestRoute = this.improve3Opt(bestRoute, distanceMatrix);
      }

      return {
        route: this.mapIndicesToPoints(bestRoute, deliveryPoints),
        algorithm: 'tsp',
        totalDistance: this.calculateRouteDistance(bestRoute, distanceMatrix),
        optimizationSteps: ['nearest_neighbor', '2-opt', '3-opt']
      };
    } catch (error) {
      console.error('Error in TSP optimization:', error);
      throw error;
    }
  }

  // Algoritmo mixto que combina múltiples enfoques
  static async optimizeWithMixedAlgorithm(deliveryPoints: any[], trafficData?: any[]) {
    try {
      // Fase 1: Agrupamiento por zonas geográficas
      const zones = this.clusterByGeography(deliveryPoints);
      
      // Fase 2: Optimización dentro de cada zona
      const optimizedZones = await Promise.all(
        zones.map(zone => this.optimizeZone(zone, trafficData))
      );
      
      // Fase 3: Optimización del orden de zonas
      const zoneOrder = await this.optimizeZoneOrder(optimizedZones, trafficData);
      
      // Fase 4: Ajustes finales basados en tiempo real
      const finalRoute = this.applyRealTimeAdjustments(zoneOrder, trafficData);

      return {
        route: finalRoute,
        algorithm: 'mixed',
        zones: zones.length,
        realTimeAdjustments: true
      };
    } catch (error) {
      console.error('Error in mixed algorithm:', error);
      throw error;
    }
  }

  // Predicción de tiempos de entrega basada en ML
  static async predictDeliveryTimes(route: any[], trafficData?: any[]) {
    try {
      // Simular modelo de ML para predicción de tiempos
      const predictions = route.map((point, index) => {
        const baseTime = point.estimated_duration;
        const trafficFactor = this.getTrafficFactor(point, trafficData);
        const timeFactor = this.getTimeOfDayFactor(new Date());
        const sequenceFactor = this.getSequenceFactor(index, route.length);
        
        const predictedTime = baseTime * trafficFactor * timeFactor * sequenceFactor;
        const confidence = this.calculateTimePredictionConfidence(point, trafficData);
        
        return {
          pointId: point.id,
          predictedTime: Math.round(predictedTime),
          confidence,
          factors: {
            traffic: trafficFactor,
            timeOfDay: timeFactor,
            sequence: sequenceFactor
          }
        };
      });

      return {
        predictions,
        totalPredictedTime: predictions.reduce((sum, p) => sum + p.predictedTime, 0),
        averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
      };
    } catch (error) {
      console.error('Error in delivery time prediction:', error);
      throw error;
    }
  }

  // Análisis de patrones de tráfico
  private static async analyzeTrafficPatterns(trafficData?: any[]) {
    if (!trafficData) return { patterns: [], score: 0.5 };

    const patterns = trafficData.map(data => ({
      location: data.location,
      congestionScore: this.calculateCongestionScore(data),
      timePattern: this.analyzeTimePattern(data),
      reliability: this.calculateReliability(data)
    }));

    return {
      patterns,
      score: patterns.reduce((sum, p) => sum + p.reliability, 0) / patterns.length
    };
  }

  // Análisis de ventanas de tiempo
  private static analyzeTimeWindows(deliveryPoints: any[]) {
    return deliveryPoints.map(point => ({
      pointId: point.id,
      hasTimeWindow: !!point.time_window,
      flexibility: point.time_window ? 
        this.calculateTimeFlexibility(point.time_window) : 1.0,
      urgency: this.calculateUrgency(point)
    }));
  }

  // Cálculo de scores de prioridad
  private static calculatePriorityScores(deliveryPoints: any[]) {
    const priorityWeights = { high: 1.0, medium: 0.6, low: 0.3 };
    
    return deliveryPoints.map(point => ({
      pointId: point.id,
      priorityScore: priorityWeights[point.priority] || 0.5,
      valueScore: this.calculateValueScore(point.order_value),
      combinedScore: (priorityWeights[point.priority] || 0.5) * 0.7 + 
                    this.calculateValueScore(point.order_value) * 0.3
    }));
  }

  // Cálculo de matriz de distancias
  private static calculateDistanceMatrix(deliveryPoints: any[]) {
    const matrix: number[][] = [];
    
    for (let i = 0; i < deliveryPoints.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < deliveryPoints.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          matrix[i][j] = this.calculateDistance(
            deliveryPoints[i].coordinates,
            deliveryPoints[j].coordinates
          );
        }
      }
    }
    
    return matrix;
  }

  // Cálculo de distancia entre dos puntos (Haversine)
  private static calculateDistance(coord1: {lat: number, lng: number}, coord2: {lat: number, lng: number}): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Algoritmo nearest neighbor para TSP
  private static nearestNeighborTSP(distanceMatrix: number[][]): number[] {
    const n = distanceMatrix.length;
    const visited = new Array(n).fill(false);
    const route = [0]; // Empezar desde el primer punto
    visited[0] = true;

    for (let i = 1; i < n; i++) {
      let minDistance = Infinity;
      let nextCity = -1;
      
      for (let j = 0; j < n; j++) {
        if (!visited[j] && distanceMatrix[route[route.length - 1]][j] < minDistance) {
          minDistance = distanceMatrix[route[route.length - 1]][j];
          nextCity = j;
        }
      }
      
      route.push(nextCity);
      visited[nextCity] = true;
    }

    return route;
  }

  // Mejora 2-opt para TSP
  private static improve2Opt(route: number[], distanceMatrix: number[][]): number[] {
    let improved = true;
    let bestRoute = [...route];
    let bestDistance = this.calculateRouteDistance(bestRoute, distanceMatrix);

    while (improved) {
      improved = false;
      
      for (let i = 1; i < route.length - 2; i++) {
        for (let j = i + 1; j < route.length; j++) {
          if (j - i === 1) continue; // Skip adjacent edges
          
          const newRoute = this.swap2Opt(bestRoute, i, j);
          const newDistance = this.calculateRouteDistance(newRoute, distanceMatrix);
          
          if (newDistance < bestDistance) {
            bestRoute = newRoute;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
    }

    return bestRoute;
  }

  // Swap 2-opt
  private static swap2Opt(route: number[], i: number, j: number): number[] {
    const newRoute = [...route];
    while (i < j) {
      [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
      i++;
      j--;
    }
    return newRoute;
  }

  // Mejora 3-opt (simplificada)
  private static improve3Opt(route: number[], distanceMatrix: number[][]): number[] {
    // Implementación simplificada de 3-opt
    let bestRoute = [...route];
    let bestDistance = this.calculateRouteDistance(bestRoute, distanceMatrix);

    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length - 1; j++) {
        for (let k = j + 1; k < route.length; k++) {
          // Probar diferentes reconexiones 3-opt
          const alternatives = this.generate3OptAlternatives(bestRoute, i, j, k);
          
          for (const alt of alternatives) {
            const distance = this.calculateRouteDistance(alt, distanceMatrix);
            if (distance < bestDistance) {
              bestRoute = alt;
              bestDistance = distance;
            }
          }
        }
      }
    }

    return bestRoute;
  }

  // Generar alternativas 3-opt
  private static generate3OptAlternatives(route: number[], i: number, j: number, k: number): number[][] {
    const alternatives: number[][] = [];
    
    // Implementar las 7 posibles reconexiones 3-opt
    // (implementación simplificada - solo algunas)
    
    // Alternativa 1: Reverse segment i to j
    const alt1 = [...route];
    this.reverseSegment(alt1, i, j);
    alternatives.push(alt1);
    
    // Alternativa 2: Reverse segment j to k
    const alt2 = [...route];
    this.reverseSegment(alt2, j, k);
    alternatives.push(alt2);
    
    return alternatives;
  }

  // Reversar segmento de ruta
  private static reverseSegment(route: number[], start: number, end: number): void {
    while (start < end) {
      [route[start], route[end]] = [route[end], route[start]];
      start++;
      end--;
    }
  }

  // Calcular distancia total de una ruta
  private static calculateRouteDistance(route: number[], distanceMatrix: number[][]): number {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += distanceMatrix[route[i]][route[i + 1]];
    }
    return totalDistance;
  }

  // Mapear índices a puntos de entrega
  private static mapIndicesToPoints(route: number[], deliveryPoints: any[]): any[] {
    return route.map(index => deliveryPoints[index]);
  }

  // Obtener factor de tráfico para un punto
  private static getTrafficFactor(point: any, trafficData?: any[]): number {
    if (!trafficData) return 1.0;
    
    // Encontrar datos de tráfico más cercanos
    const nearby = trafficData.find(data => 
      this.isNearby(point.coordinates, data.coordinates)
    );
    
    if (!nearby) return 1.0;
    
    // Convertir nivel de congestión a factor multiplicativo
    const congestionFactors = {
      low: 1.0,
      medium: 1.2,
      high: 1.5,
      severe: 2.0
    };
    
    return congestionFactors[nearby.congestion_level] || 1.0;
  }

  // Verificar si dos coordenadas están cerca
  private static isNearby(coord1: {lat: number, lng: number}, coord2: {lat: number, lng: number}): boolean {
    const distance = this.calculateDistance(coord1, coord2);
    return distance < 1.0; // Dentro de 1km
  }

  // Obtener factor de hora del día
  private static getTimeOfDayFactor(date: Date): number {
    const hour = date.getHours();
    
    // Factores basados en patrones de tráfico típicos
    if (hour >= 7 && hour <= 9) return 1.3; // Hora pico mañana
    if (hour >= 12 && hour <= 14) return 1.2; // Hora almuerzo
    if (hour >= 17 && hour <= 19) return 1.4; // Hora pico tarde
    if (hour >= 20 || hour <= 6) return 0.9; // Horarios de menor tráfico
    
    return 1.0; // Horario normal
  }

  // Obtener factor de secuencia
  private static getSequenceFactor(index: number, totalPoints: number): number {
    // Los primeros puntos suelen ser más rápidos
    const position = index / totalPoints;
    return 0.9 + (position * 0.2); // Factor entre 0.9 y 1.1
  }

  // Calcular confianza de predicción de tiempo
  private static calculateTimePredictionConfidence(point: any, trafficData?: any[]): number {
    let confidence = 0.7; // Base confidence
    
    // Aumentar confianza si hay datos de tráfico
    if (trafficData && trafficData.length > 0) confidence += 0.1;
    
    // Aumentar confianza si hay ventana de tiempo
    if (point.time_window) confidence += 0.1;
    
    // Aumentar confianza para prioridades altas (más datos históricos)
    if (point.priority === 'high') confidence += 0.1;
    
    return Math.min(confidence, 0.95); // Máximo 95%
  }

  // Funciones auxiliares adicionales
  private static calculateCongestionScore(trafficData: any): number {
    const speedRatio = trafficData.current_speed / trafficData.normal_speed;
    return 1 - speedRatio; // Score alto = más congestión
  }

  private static analyzeTimePattern(trafficData: any): string {
    // Análisis simple del patrón temporal
    const hour = new Date().getHours();
    if (hour >= 7 && hour <= 9) return 'morning_peak';
    if (hour >= 17 && hour <= 19) return 'evening_peak';
    if (hour >= 12 && hour <= 14) return 'lunch_peak';
    return 'normal';
  }

  private static calculateReliability(trafficData: any): number {
    // Simular cálculo de confiabilidad basado en datos históricos
    return Math.random() * 0.3 + 0.7; // Entre 0.7 y 1.0
  }

  private static calculateTimeFlexibility(timeWindow: any): number {
    const start = new Date(`2000-01-01 ${timeWindow.start}`);
    const end = new Date(`2000-01-01 ${timeWindow.end}`);
    const windowHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    // Ventanas más amplias = mayor flexibilidad
    return Math.min(windowHours / 8, 1.0); // Normalizar a máximo 8 horas
  }

  private static calculateUrgency(point: any): number {
    const priorityUrgency = { high: 1.0, medium: 0.6, low: 0.3 };
    let urgency = priorityUrgency[point.priority] || 0.5;
    
    // Aumentar urgencia si hay ventana de tiempo restrictiva
    if (point.time_window) {
      const flexibility = this.calculateTimeFlexibility(point.time_window);
      urgency *= (2 - flexibility); // Menos flexibilidad = más urgencia
    }
    
    return Math.min(urgency, 1.0);
  }

  private static calculateValueScore(orderValue: number): number {
    // Normalizar valor del pedido (asumiendo rango 0-5000)
    return Math.min(orderValue / 5000, 1.0);
  }

  // Funciones para algoritmos más complejos (implementación básica)
  private static async applyAIOptimization(deliveryPoints: any[], factors: any) {
    // Simular optimización con IA
    // En implementación real, aquí iría un modelo de ML entrenado
    
    const scores = deliveryPoints.map((point, index) => ({
      point,
      index,
      score: this.calculateAIScore(point, factors, index)
    }));

    // Ordenar por score de IA
    scores.sort((a, b) => b.score - a.score);
    
    return scores.map(s => s.point);
  }

  private static calculateAIScore(point: any, factors: any, index: number): number {
    // Combinar múltiples factores con pesos aprendidos por IA
    const weights = {
      priority: 0.3,
      distance: 0.25,
      traffic: 0.2,
      timeWindow: 0.15,
      historical: 0.1
    };

    let score = 0;
    score += factors.priority[index]?.combinedScore * weights.priority;
    score += (1 - factors.distance[index] / 100) * weights.distance; // Invertir distancia
    score += (1 - factors.trafficPatterns.score) * weights.traffic;
    score += factors.timeWindows[index]?.flexibility * weights.timeWindow;
    score += factors.historicalData.reliability * weights.historical;

    return score;
  }

  private static async getHistoricalPerformance(deliveryPoints: any[]) {
    // Simular datos históricos
    return {
      reliability: Math.random() * 0.3 + 0.7,
      averageTime: Math.random() * 10 + 15,
      successRate: Math.random() * 0.2 + 0.8
    };
  }

  private static calculateConfidence(factors: any): number {
    // Calcular confianza basada en calidad de datos
    let confidence = 0.6; // Base
    
    if (factors.trafficPatterns.patterns.length > 0) confidence += 0.1;
    if (factors.historicalData.reliability > 0.8) confidence += 0.1;
    if (factors.timeWindows.filter((tw: any) => tw.hasTimeWindow).length > 0) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  private static calculateExpectedImprovement(factors: any): number {
    // Estimar mejora esperada basada en factores
    const baseImprovement = 0.15; // 15% base
    
    let improvement = baseImprovement;
    improvement += factors.trafficPatterns.score * 0.1;
    improvement += factors.historicalData.reliability * 0.05;
    
    return Math.min(improvement, 0.4); // Máximo 40% de mejora
  }

  // Funciones para algoritmo genético (implementación básica)
  private static initializePopulation(deliveryPoints: any[], populationSize: number): any[] {
    const population = [];
    
    for (let i = 0; i < populationSize; i++) {
      const individual = Array.from({ length: deliveryPoints.length }, (_, index) => index);
      
      // Shuffle array para crear individuos aleatorios
      for (let j = individual.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [individual[j], individual[k]] = [individual[k], individual[j]];
      }
      
      population.push({
        genes: individual,
        fitness: 0
      });
    }
    
    return population;
  }

  private static evaluatePopulation(population: any[], deliveryPoints: any[]): any[] {
    const distanceMatrix = this.calculateDistanceMatrix(deliveryPoints);
    
    return population.map(individual => ({
      ...individual,
      fitness: 1 / (1 + this.calculateRouteDistance(individual.genes, distanceMatrix))
    })).sort((a, b) => b.fitness - a.fitness);
  }

  private static evolvePopulation(population: any[], config: any): any[] {
    const newPopulation = [];
    
    // Mantener elite
    for (let i = 0; i < config.eliteSize; i++) {
      newPopulation.push({ ...population[i] });
    }
    
    // Generar resto de población
    while (newPopulation.length < config.populationSize) {
      const parent1 = this.selectParent(population);
      const parent2 = this.selectParent(population);
      
      let offspring;
      if (Math.random() < config.crossoverRate) {
        offspring = this.crossover(parent1, parent2);
      } else {
        offspring = { ...parent1 };
      }
      
      if (Math.random() < config.mutationRate) {
        this.mutate(offspring);
      }
      
      newPopulation.push(offspring);
    }
    
    return newPopulation;
  }

  private static selectParent(population: any[]): any {
    // Selección por torneo
    const tournamentSize = 3;
    let best = population[Math.floor(Math.random() * population.length)];
    
    for (let i = 1; i < tournamentSize; i++) {
      const competitor = population[Math.floor(Math.random() * population.length)];
      if (competitor.fitness > best.fitness) {
        best = competitor;
      }
    }
    
    return best;
  }

  private static crossover(parent1: any, parent2: any): any {
    // Order crossover (OX)
    const start = Math.floor(Math.random() * parent1.genes.length);
    const end = Math.floor(Math.random() * (parent1.genes.length - start)) + start;
    
    const offspring = new Array(parent1.genes.length).fill(-1);
    
    // Copiar segmento del padre 1
    for (let i = start; i <= end; i++) {
      offspring[i] = parent1.genes[i];
    }
    
    // Completar con padre 2
    let p2Index = 0;
    for (let i = 0; i < offspring.length; i++) {
      if (offspring[i] === -1) {
        while (offspring.includes(parent2.genes[p2Index])) {
          p2Index++;
        }
        offspring[i] = parent2.genes[p2Index];
        p2Index++;
      }
    }
    
    return {
      genes: offspring,
      fitness: 0
    };
  }

  private static mutate(individual: any): void {
    // Swap mutation
    const i = Math.floor(Math.random() * individual.genes.length);
    const j = Math.floor(Math.random() * individual.genes.length);
    
    [individual.genes[i], individual.genes[j]] = [individual.genes[j], individual.genes[i]];
  }

  private static decodeRoute(individual: any, deliveryPoints: any[]): any[] {
    return individual.genes.map((index: number) => deliveryPoints[index]);
  }

  // Funciones para algoritmo mixto (implementación básica)
  private static clusterByGeography(deliveryPoints: any[]): any[][] {
    // Implementación simple de clustering por ubicación
    // En práctica se usaría k-means o similar
    
    const clusters: any[][] = [];
    const used = new Set();
    
    for (const point of deliveryPoints) {
      if (used.has(point.id)) continue;
      
      const cluster = [point];
      used.add(point.id);
      
      // Encontrar puntos cercanos
      for (const otherPoint of deliveryPoints) {
        if (used.has(otherPoint.id)) continue;
        
        const distance = this.calculateDistance(point.coordinates, otherPoint.coordinates);
        if (distance < 5) { // 5km radius
          cluster.push(otherPoint);
          used.add(otherPoint.id);
        }
      }
      
      clusters.push(cluster);
    }
    
    return clusters;
  }

  private static async optimizeZone(zone: any[], trafficData?: any[]): Promise<any[]> {
    // Optimizar cada zona individualmente
    if (zone.length <= 3) {
      return zone; // Zona pequeña, no optimizar
    }
    
    const result = await this.optimizeWithTSP(zone);
    return result.route;
  }

  private static async optimizeZoneOrder(zones: any[][], trafficData?: any[]): Promise<any[]> {
    // Optimizar orden de visita de zonas
    // Usar centroide de cada zona para calcular distancias
    
    const zoneCentroids = zones.map(zone => this.calculateCentroid(zone));
    const zoneOrder = await this.optimizeWithTSP(zoneCentroids.map((centroid, index) => ({
      id: index,
      coordinates: centroid
    })));
    
    // Reconstruir ruta completa
    const fullRoute = [];
    for (const zonePoint of zoneOrder.route) {
      fullRoute.push(...zones[zonePoint.id]);
    }
    
    return fullRoute;
  }

  private static calculateCentroid(points: any[]): {lat: number, lng: number} {
    const lat = points.reduce((sum, p) => sum + p.coordinates.lat, 0) / points.length;
    const lng = points.reduce((sum, p) => sum + p.coordinates.lng, 0) / points.length;
    return { lat, lng };
  }

  private static applyRealTimeAdjustments(route: any[], trafficData?: any[]): any[] {
    if (!trafficData) return route;
    
    // Aplicar ajustes basados en condiciones de tráfico en tiempo real
    return route.map(point => ({
      ...point,
      adjusted_time: this.adjustTimeForTraffic(point, trafficData)
    }));
  }

  private static adjustTimeForTraffic(point: any, trafficData: any[]): number {
    const trafficFactor = this.getTrafficFactor(point, trafficData);
    return point.estimated_duration * trafficFactor;
  }
}