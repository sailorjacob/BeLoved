import Foundation
import Capacitor
import WebKit

@objc(IosFixes)
public class IosFixes: CAPPlugin {
    override public func load() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleURLChange),
            name: NSNotification.Name(rawValue: "capacitorSiteLoaded"),
            object: nil
        )
        
        // Also listen for webview finishes loading
        bridge?.webView?.navigationDelegate = self
    }
    
    @objc func handleURLChange(_ notification: Notification) {
        applyFixesToWebView()
    }
    
    func applyFixesToWebView() {
        DispatchQueue.main.async {
            guard let webView = self.webView else { return }
            
            // Only inject our CSS fixes after the web view has loaded the main app
            if let url = webView.url?.absoluteString,
               url.contains("be-loved-scheduler.vercel.app") {
                
                // CSS to fix dashboard tabs and layout issues
                let cssString = """
                /* iOS-specific fixes for the BeLoved Rides app */
                html { -webkit-text-size-adjust: 100%; }
                body { zoom: 0.92; }
                
                /* Fix for dropdown menus to prevent zoom glitches */
                div[role="menu"], .dropdown-menu, div[class*="dropdown"], 
                div[class*="menu"], div[class*="popover"], nav[role="navigation"] {
                    position: fixed !important;
                    top: auto !important;
                    right: 16px !important;
                    transform: none !important;
                    max-height: 80vh !important;
                    overflow-y: auto !important;
                    z-index: 9999 !important;
                }
                
                /* Style for user profile dropdown */
                div[role="menu"] a, .dropdown-menu a, 
                div[class*="dropdown"] a, div[class*="menu"] a {
                    padding: 12px 16px !important;
                    font-size: 16px !important;
                    display: block !important;
                    white-space: nowrap !important;
                }
                
                /* Driver Dashboard header fix */
                div:contains("Driver Dashboard") > h1, h1:contains("Driver Dashboard") {
                    font-size: 1.8rem !important;
                    margin: 16px 0 !important;
                    padding: 0 !important;
                }
                
                /* Driver Overview title fix */
                h1:contains("Driver Overview"), h2:contains("Driver Overview") {
                    font-size: 1.4rem !important;
                    margin-bottom: 12px !important;
                    font-weight: 600 !important;
                }
                
                /* Fix for refresh buttons */
                button:contains("Refresh"), a:contains("Refresh") {
                    padding: 8px 16px !important;
                    font-size: 0.9rem !important;
                    height: auto !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                
                /* Date display in Driver Dashboard */
                time, .date-display, svg + span, button:contains("April") {
                    font-size: 1rem !important;
                    padding: 8px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                }
                
                /* Grid layout for stats in Driver Dashboard */
                div.grid, div.stats-grid, div.flex.justify-between, div.stats {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 16px !important;
                    width: 100% !important;
                    margin: 16px 0 !important;
                }
                
                /* Stats labels and values */
                div.stat, div.stat-item, div.flex.flex-col {
                    text-align: center !important;
                    padding: 8px !important;
                }
                
                div.stat h3, div.stat-item h3, div.flex.flex-col h3, 
                div.stat-label, span:contains("Completed Rides"), span:contains("Total Miles") {
                    font-size: 0.9rem !important;
                    margin-bottom: 4px !important;
                    color: #666 !important;
                }
                
                div.stat p, div.stat-item p, div.flex.flex-col p,
                div.stat-value, h3 + p, h3 + div {
                    font-size: 2rem !important;
                    font-weight: 700 !important;
                    margin: 0 !important;
                }
                
                /* Fix for the driver dashboard tabs that are condensed */
                [role="tablist"], .tabs, nav.flex, nav.space-x-2, nav.space-x-4 {
                    display: flex !important;
                    flex-wrap: wrap !important;
                    justify-content: space-between !important;
                    gap: 2px !important;
                    padding: 4px !important;
                    margin: 16px 0 !important;
                    width: 100% !important;
                    border-radius: 8px !important;
                    background-color: #f5f5f5 !important;
                }
                
                /* Make each tab button better sized for mobile */
                [role="tab"], .tab, button[role="tab"] {
                    padding: 8px !important;
                    white-space: nowrap !important;
                    font-size: 0.85rem !important;
                    flex: 1 1 0 !important;
                    text-align: center !important;
                    border-radius: 6px !important;
                }
                
                /* Fix specifically for the ride numbers in tabs */
                [role="tab"] span, .tab span, .badge {
                    margin-left: 4px !important;
                    font-size: 0.75rem !important;
                    padding: 2px 6px !important;
                    border-radius: 999px !important;
                    display: inline-block !important;
                }
                
                /* Fix for the ride list items to be more spaced */
                .ride-item, .card, div[role="article"], .list-item {
                    margin-bottom: 12px !important;
                    padding: 12px !important;
                    border-radius: 8px !important;
                    border: 1px solid #eee !important;
                }
                
                /* Ride time display */
                .time, .ride-time, h3:contains("PM"), h3:contains("AM") {
                    font-size: 1.2rem !important;
                    font-weight: 600 !important;
                    margin-bottom: 8px !important;
                }
                
                /* Ride status */
                .status, .ride-status, span:contains("Assigned") {
                    font-size: 0.8rem !important;
                    padding: 4px 8px !important;
                    border-radius: 4px !important;
                    background-color: #f0f9ff !important;
                    color: #0369a1 !important;
                    font-weight: 500 !important;
                    float: right !important;
                }
                
                /* Passenger name and phone */
                .passenger-name, .name, .rider-name {
                    font-size: 1.1rem !important;
                    margin: 8px 0 !important;
                    font-weight: 500 !important;
                }
                
                .phone, .phone-number, a[href^="tel:"] {
                    font-size: 1rem !important;
                    color: #555 !important;
                    margin: 4px 0 12px 0 !important;
                    display: block !important;
                }
                
                /* Ride addresses */
                .address, .address-line, .from, .to {
                    font-size: 0.95rem !important;
                    margin: 4px 0 !important;
                    line-height: 1.4 !important;
                }
                
                .trip-id, .ride-id, small:contains("Trip ID") {
                    font-size: 0.8rem !important;
                    color: #777 !important;
                    margin-top: 8px !important;
                    display: block !important;
                }
                
                /* Fix container spacing */
                .container, .content-container, main > div {
                    width: 100% !important;
                    max-width: 100vw !important;
                    padding: 12px !important;
                    overflow-x: hidden !important;
                }
                
                /* Section titles */
                h2:contains("All Assigned Rides"), h2:contains("Individual Rides") {
                    font-size: 1.2rem !important;
                    margin: 20px 0 12px 0 !important;
                    font-weight: 600 !important;
                }
                
                /* Add margin to bottom of page for better scrolling */
                body {
                    margin-bottom: 20px !important;
                }
                """
                
                // JavaScript to inject the CSS and fix dropdown behavior
                let jsString = """
                (function() {
                    // Create a style element
                    const style = document.createElement('style');
                    style.textContent = `\(cssString)`;
                    style.id = 'ios-fixes-css';
                    
                    // Remove any existing style with the same ID
                    const existingStyle = document.getElementById('ios-fixes-css');
                    if (existingStyle) {
                        existingStyle.remove();
                    }
                    
                    // Add the style to the document head
                    document.head.appendChild(style);
                    
                    // Fix viewport meta tag if needed
                    let viewportMeta = document.querySelector('meta[name="viewport"]');
                    if (!viewportMeta) {
                        viewportMeta = document.createElement('meta');
                        viewportMeta.name = 'viewport';
                        document.head.appendChild(viewportMeta);
                    }
                    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
                    
                    // Add custom classes to make content selectors more reliable
                    document.querySelectorAll('h1, h2, h3, div, span, button, a').forEach(el => {
                        const text = el.textContent || '';
                        if (text.includes('Driver Dashboard')) {
                            el.classList.add('driver-dashboard-heading');
                        } else if (text.includes('Driver Overview')) {
                            el.classList.add('driver-overview-heading');
                        } else if (text.includes('Assigned Rides')) {
                            el.classList.add('assigned-rides-heading');
                        } else if (text.includes('Completed Rides')) {
                            el.classList.add('completed-rides-heading');
                        } else if (text.includes('Total Miles')) {
                            el.classList.add('total-miles-heading');
                        }
                    });
                    
                    // Monitor for clicks on profile button to prevent scroll jumps
                    document.addEventListener('click', function(e) {
                        // Try to identify profile menu buttons by common attributes
                        if (e.target && (
                            e.target.textContent === 'z' || 
                            e.target.textContent === 'zombieblxster' ||
                            (e.target.getAttribute && e.target.getAttribute('aria-haspopup') === 'true') ||
                            e.target.closest('[aria-haspopup="true"]')
                        )) {
                            // Prevent default scroll behavior
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Let the click event continue
                            return true;
                        }
                    }, true);
                    
                    // Monitor for route changes in case this is a SPA
                    const pushState = history.pushState;
                    history.pushState = function() {
                        pushState.apply(history, arguments);
                        setTimeout(() => {
                            console.log('Route changed, reapplying iOS fixes');
                            // Reapply the style after page transitions
                            if (existingStyle) {
                                existingStyle.remove();
                            }
                            document.head.appendChild(style);
                            
                            // Reapply custom classes
                            document.querySelectorAll('h1, h2, h3, div, span, button, a').forEach(el => {
                                const text = el.textContent || '';
                                if (text.includes('Driver Dashboard')) {
                                    el.classList.add('driver-dashboard-heading');
                                } else if (text.includes('Driver Overview')) {
                                    el.classList.add('driver-overview-heading');
                                } else if (text.includes('Assigned Rides')) {
                                    el.classList.add('assigned-rides-heading');
                                } else if (text.includes('Completed Rides')) {
                                    el.classList.add('completed-rides-heading');
                                } else if (text.includes('Total Miles')) {
                                    el.classList.add('total-miles-heading');
                                }
                            });
                        }, 300);
                    };
                    
                    console.log('iOS fixes applied by Capacitor plugin');
                })();
                """
                
                // Execute the JavaScript to inject the CSS
                webView.evaluateJavaScript(jsString, completionHandler: { (result, error) in
                    if let error = error {
                        print("Error injecting iOS fixes: \(error)")
                    } else {
                        print("Successfully injected iOS fixes")
                    }
                })
            }
        }
    }
}

// Extend to implement WKNavigationDelegate to catch navigation events
extension IosFixes: WKNavigationDelegate {
    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Apply fixes after navigation completes
        applyFixesToWebView()
    }
} 