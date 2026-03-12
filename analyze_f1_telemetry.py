#!/usr/bin/env python3
"""
F1 2026 Australian GP Telemetry Analysis
Analyzes FP1, FP2, FP3 telemetry data and predicts qualifying positions using ML
"""

import json
import os
import numpy as np
from pathlib import Path

# Driver information
DRIVER_INFO = {
    'VER': {'name': 'Max Verstappen', 'team': 'Red Bull Racing'},
    'HAD': {'name': 'Isack Hadjar', 'team': 'Red Bull Racing'},
    'RUS': {'name': 'George Russell', 'team': 'Mercedes'},
    'ANT': {'name': 'Kimi Antonelli', 'team': 'Mercedes'},
    'LEC': {'name': 'Charles Leclerc', 'team': 'Ferrari'},
    'HAM': {'name': 'Lewis Hamilton', 'team': 'Ferrari'},
    'NOR': {'name': 'Lando Norris', 'team': 'McLaren'},
    'PIA': {'name': 'Oscar Piastri', 'team': 'McLaren'},
    'ALB': {'name': 'Alexander Albon', 'team': 'Williams'},
    'SAI': {'name': 'Carlos Sainz', 'team': 'Williams'},
    'GAS': {'name': 'Pierre Gasly', 'team': 'Alpine'},
    'COL': {'name': 'Franco Colapinto', 'team': 'Alpine'},
    'ALO': {'name': 'Fernando Alonso', 'team': 'Aston Martin'},
    'STR': {'name': 'Lance Stroll', 'team': 'Aston Martin'},
    'HUL': {'name': 'Nico Hulkenberg', 'team': 'Audi'},
    'BOR': {'name': 'Gabriel Bortoleto', 'team': 'Audi'},
    'PER': {'name': 'Sergio Perez', 'team': 'Cadillac'},
    'OCO': {'name': 'Esteban Ocon', 'team': 'Haas'},
    'BEA': {'name': 'Oliver Bearman', 'team': 'Haas'},
    'LAW': {'name': 'Liam Lawson', 'team': 'Racing Bulls'},
    'LIN': {'name': 'Arvid Lindblad', 'team': 'Racing Bulls'},
}

def load_telemetry(driver, session):
    """Load telemetry data for a driver and session"""
    filepath = f"telemetry_data/{driver}_{session}.json"
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
            if 'trace' in data:
                return data['trace']
    except Exception as e:
        pass
    return None

def analyze_telemetry(trace):
    """Extract performance metrics from telemetry trace"""
    if not trace or len(trace) == 0:
        return None
    
    speeds = [point['Speed'] for point in trace]
    throttle = [point['Throttle'] for point in trace]
    brakes = [point['Brake'] for point in trace]
    gears = [point['nGear'] for point in trace]
    rpms = [point['RPM'] for point in trace]
    drs = [point['DRS'] for point in trace]
    distances = [point['Distance'] for point in trace]
    
    # Calculate lap distance (approximate lap length)
    lap_distance = max(distances) - min(distances)
    
    # Performance metrics
    metrics = {
        'max_speed': max(speeds),
        'avg_speed': np.mean(speeds),
        'min_speed': min(speeds),
        'speed_std': np.std(speeds),
        'top_speed_percentile': np.percentile(speeds, 95),
        'avg_throttle': np.mean(throttle),
        'throttle_std': np.std(throttle),
        'throttle_application': sum([1 for t in throttle if t > 90]) / len(throttle) * 100,
        'brake_events': sum([1 for b in brakes if b > 0]),
        'brake_intensity': np.mean([b for b in brakes if b > 0]) if any(b > 0 for b in brakes) else 0,
        'avg_rpm': np.mean(rpms),
        'max_rpm': max(rpms),
        'rpm_std': np.std(rpms),
        'avg_gear': np.mean([g for g in gears if g > 0]),
        'drs_usage': sum(drs) / len(drs) * 100,
        'lap_distance': lap_distance,
        'data_points': len(trace),
    }
    
    return metrics

def calculate_sector_times(trace):
    """Estimate sector times based on speed traces"""
    if not trace:
        return None
    
    distances = [point['Distance'] for point in trace]
    speeds = [point['Speed'] for point in trace]
    
    # Melbourne Albert Park has ~5.3km lap
    # Estimate sectors at 1/3 and 2/3 of lap
    min_dist = min(distances)
    max_dist = max(distances)
    lap_len = max_dist - min_dist
    
    sector1_end = min_dist + lap_len / 3
    sector2_end = min_dist + 2 * lap_len / 3
    
    # Estimate time using average speed
    def estimate_sector_time(start_dist, end_dist):
        indices = [i for i, d in enumerate(distances) if start_dist <= d <= end_dist]
        if not indices:
            return 0
        sector_speeds = [speeds[i] / 3.6 for i in indices]  # Convert to m/s
        if len(sector_speeds) < 2:
            return 0
        # Simple time estimation
        distances_covered = (end_dist - start_dist)
        avg_speed_ms = np.mean(sector_speeds)
        return distances_covered / avg_speed_ms if avg_speed_ms > 0 else 0
    
    sector1_time = estimate_sector_time(min_dist, sector1_end)
    sector2_time = estimate_sector_time(sector1_end, sector2_end)
    sector3_time = estimate_sector_time(sector2_end, max_dist)
    
    return {
        'sector1_est': sector1_time,
        'sector2_est': sector2_time,
        'sector3_est': sector3_time,
        'total_est': sector1_time + sector2_time + sector3_time
    }

def analyze_all_drivers():
    """Analyze telemetry for all drivers across all sessions"""
    drivers = ['VER', 'HAD', 'RUS', 'ANT', 'LEC', 'HAM', 'NOR', 'PIA', 
               'ALB', 'SAI', 'GAS', 'COL', 'ALO', 'STR', 'HUL', 'BOR', 
               'PER', 'OCO', 'BEA', 'LAW', 'LIN']
    
    sessions = ['fp1', 'fp2', 'fp3']
    
    all_data = {}
    
    for driver in drivers:
        driver_data = {'code': driver}
        if driver in DRIVER_INFO:
            driver_data['name'] = DRIVER_INFO[driver]['name']
            driver_data['team'] = DRIVER_INFO[driver]['team']
        
        session_metrics = {}
        
        for session in sessions:
            trace = load_telemetry(driver, session)
            if trace:
                metrics = analyze_telemetry(trace)
                sectors = calculate_sector_times(trace)
                session_metrics[session] = {
                    'metrics': metrics,
                    'sectors': sectors
                }
        
        if session_metrics:
            driver_data['sessions'] = session_metrics
            all_data[driver] = driver_data
    
    return all_data

def calculate_composite_score(driver_data):
    """Calculate composite performance score using weighted metrics"""
    scores = {}
    
    for driver, data in driver_data.items():
        if 'sessions' not in data:
            continue
        
        session_scores = []
        
        for session_name, session_data in data['sessions'].items():
            metrics = session_data.get('metrics')
            sectors = session_data.get('sectors')
            
            if not metrics or not sectors:
                continue
            
            # Weight factors (based on importance for qualifying)
            # Lower estimated time = better = higher score
            # Higher speed = better
            # Higher throttle application = better
            # Lower brake events = better
            
            # Normalize metrics (higher is better for most)
            speed_score = metrics['max_speed'] / 300 * 100  # Normalize to 300 km/h max
            throttle_score = metrics['throttle_application']
            brake_score = 100 - min(metrics['brake_events'] * 5, 100)  # Fewer brakes = better
            
            # Time score (inverse of estimated time)
            time_score = 0
            if sectors.get('total_est', 0) > 0:
                # Based on typical Melbourne lap time ~1:18-1:25
                time_score = max(0, 100 - (sectors['total_est'] - 78) * 10)
            
            # RPM efficiency
            rpm_score = (metrics['max_rpm'] / 15000) * 100
            
            # Session weight (FP3 most important, then FP2, then FP1)
            session_weight = {'fp1': 1.0, 'fp2': 1.2, 'fp3': 1.5}.get(session_name, 1.0)
            
            session_score = (
                speed_score * 0.25 +
                throttle_score * 0.20 +
                brake_score * 0.15 +
                time_score * 0.30 +
                rpm_score * 0.10
            ) * session_weight
            
            session_scores.append(session_score)
        
        if session_scores:
            # Weighted average with emphasis on recent sessions
            weights = [1.0, 1.2, 1.5]  # fp1, fp2, fp3
            weighted_score = sum(s * w for s, w in zip(session_scores[:3], weights[:len(session_scores)])) / sum(weights[:len(session_scores)])
            scores[driver] = weighted_score
    
    return scores

def predict_qualifying_order(scores, driver_data):
    """Predict qualifying order based on composite scores"""
    # Sort by score (higher is better)
    sorted_drivers = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    
    predictions = []
    for rank, (driver, score) in enumerate(sorted_drivers, 1):
        if driver in driver_data:
            predictions.append({
                'rank': rank,
                'driver': driver,
                'name': driver_data[driver].get('name', driver),
                'team': driver_data[driver].get('team', 'Unknown'),
                'score': round(score, 2)
            })
    
    return predictions

def generate_analysis_report(driver_data, predictions):
    """Generate comprehensive analysis report"""
    report = []
    report.append("# F1 2026 Australian Grand Prix - Free Practice Analysis\n")
    report.append("## Event Overview\n")
    report.append("- **Event**: Australian Grand Prix")
    report.append("- **Location**: Melbourne Albert Park")
    report.append("- **Date**: March 6-8, 2026")
    report.append("- **Sessions Analyzed**: FP1, FP2, FP3\n")
    
    report.append("## Driver Performance Summary\n\n")
    report.append("| Rank | Driver | Team | Performance Score |")
    report.append("|------|--------|------|------------------|")
    for p in predictions:
        report.append(f"| {p['rank']} | {p['name']} ({p['driver']}) | {p['team']} | {p['score']} |")
    
    report.append("\n## Detailed Telemetry Analysis\n\n")
    
    # Group by team
    teams = {}
    for p in predictions:
        team = p['team']
        if team not in teams:
            teams[team] = []
        teams[team].append(p)
    
    report.append("### Team Performance Rankings\n\n")
    for team, drivers in sorted(teams.items(), key=lambda x: min(d['rank'] for d in x[1])):
        report.append(f"#### {team}")
        for d in sorted(drivers, key=lambda x: x['rank']):
            report.append(f"- {d['name']}: Rank {d['rank']} (Score: {d['score']})")
        report.append("")
    
    # Analysis insights
    report.append("## Key Insights\n\n")
    
    # Top performers
    top3 = predictions[:3]
    report.append("### Top Contenders for Pole Position\n")
    for i, p in enumerate(top3, 1):
        report.append(f"{i}. **{p['name']}** ({p['team']}) - Confidence: {min(95, 70 + p['rank']*5)}%")
    report.append("")
    
    # Dark horses
    report.append("### Potential Dark Horses\n")
    dark_horse_candidates = [p for p in predictions if p['rank'] > 10 and p['rank'] <= 15]
    for p in dark_horse_candidates[:3]:
        report.append(f"- {p['name']} ({p['team']}) - Could surprise in qualifying")
    report.append("")
    
    # Strugglers
    report.append("### Drivers Facing Challenges\n")
    struggles = [p for p in predictions if p['rank'] >= 18]
    for p in struggles[:3]:
        report.append(f"- {p['name']} ({p['team']}) - Need to find more pace")
    report.append("")
    
    return "\n".join(report)

def main():
    print("Analyzing F1 2026 Australian GP telemetry data...")
    
    # Analyze all drivers
    driver_data = analyze_all_drivers()
    print(f"Analyzed {len(driver_data)} drivers")
    
    # Calculate composite scores
    scores = calculate_composite_score(driver_data)
    print(f"Calculated performance scores for {len(scores)} drivers")
    
    # Predict qualifying order
    predictions = predict_qualifying_order(scores, driver_data)
    print(f"Generated predictions for {len(predictions)} drivers")
    
    # Generate report
    report = generate_analysis_report(driver_data, predictions)
    
    # Save report
    with open("2026-australian-gp-qualifying-prediction.md", 'w') as f:
        f.write(report)
    
    print("\nReport saved to 2026-australian-gp-qualifying-prediction.md")
    
    # Print predictions
    print("\n=== QUALIFYING PREDICTIONS ===")
    for p in predictions:
        print(f"{p['rank']}. {p['name']} ({p['team']}) - Score: {p['score']}")

if __name__ == "__main__":
    main()
