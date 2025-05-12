import React, { useState } from 'react';
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Search, DollarSign, Target, TrendingUp, Users, CheckCircle } from 'lucide-react';
import * as _ from 'lodash';
import * as Papa from 'papaparse';

export default function SearchAdsDashboard() {
  // Load the CSV data from the uploaded file
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Parse the data
  const csvData = window.fs.readFile('Search terms report (3).csv', { encoding: 'utf8' });
  const parsedData = Papa.parse(csvData, { header: true, skipEmptyLines: true, dynamicTyping: true });
  const data = parsedData.data.filter(row => row['Search term'] && !row['Search term'].includes('Total:'));
  
  // Calculate key metrics
  const totalImpressions = _.sumBy(data, row => parseFloat(row['Impr.'] || 0));
  const totalInteractions = _.sumBy(data, row => parseFloat(row['Interactions'] || 0));
  const totalCost = _.sumBy(data, row => parseFloat(row['Cost (Converted currency)'] || 0));
  const avgCPC = totalCost / totalInteractions || 0;
  const conversionRate = (totalInteractions / totalImpressions) * 100 || 0;
  
  // Group by campaign
  const campaignData = _.chain(data)
    .groupBy('Campaign')
    .map((items, campaign) => ({
      campaign,
      impressions: _.sumBy(items, row => parseFloat(row['Impr.'] || 0)),
      interactions: _.sumBy(items, row => parseFloat(row['Interactions'] || 0)),
      cost: _.sumBy(items, row => parseFloat(row['Cost (Converted currency)'] || 0)),
      interactionRate: _.sumBy(items, row => parseFloat(row['Interactions'] || 0)) / _.sumBy(items, row => parseFloat(row['Impr.'] || 0)) * 100
    }))
    .value();
  
  // Get top search terms by interactions
  const topSearchTerms = _.chain(data)
    .sortBy(row => -(parseFloat(row['Interactions'] || 0)))
    .take(10)
    .map(row => ({
      term: row['Search term'],
      interactions: parseFloat(row['Interactions'] || 0),
      impressions: parseFloat(row['Impr.'] || 0),
      cost: parseFloat(row['Cost (Converted currency)'] || 0),
      interactionRate: parseFloat(row['Interaction rate']?.replace('%', '') || 0)
    }))
    .value();
  
  // Match type distribution
  const matchTypeData = _.chain(data)
    .groupBy('Match type')
    .map((items, type) => ({
      name: type,
      value: _.sumBy(items, row => parseFloat(row['Interactions'] || 0))
    }))
    .value();
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Riga Business Coaching - Search Ads Dashboard</h1>
        <p className="text-gray-600">Analysis of search terms performance for business coaching campaigns in Melbourne</p>
      </div>
      
      {/* Tabs */}
      <div className="flex mb-6 border-b">
        <button 
          className={`px-4 py-2 mr-2 ${selectedTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`px-4 py-2 mr-2 ${selectedTab === 'searchTerms' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setSelectedTab('searchTerms')}
        >
          Search Terms
        </button>
        <button 
          className={`px-4 py-2 mr-2 ${selectedTab === 'campaigns' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setSelectedTab('campaigns')}
        >
          Campaigns
        </button>
      </div>
      
      {selectedTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <Search size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Impressions</p>
                <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Interactions</p>
                <p className="text-2xl font-bold">{totalInteractions.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow flex items-center">
              <div className="rounded-full bg-purple-100 p-3 mr-4">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Interaction Rate</p>
                <p className="text-2xl font-bold">{conversionRate.toFixed(2)}%</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow flex items-center">
              <div className="rounded-full bg-red-100 p-3 mr-4">
                <DollarSign size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cost (USD)</p>
                <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow flex items-center">
              <div className="rounded-full bg-yellow-100 p-3 mr-4">
                <DollarSign size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. CPC (USD)</p>
                <p className="text-2xl font-bold">${avgCPC.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Top Performing Search Terms</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSearchTerms.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="term" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [value, name === 'interactions' ? 'Interactions' : 'Interaction Rate']} />
                  <Legend />
                  <Bar dataKey="interactions" fill="#8884d8" name="Interactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Match Type Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={matchTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {matchTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} interactions`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="campaign" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="impressions" fill="#8884d8" name="Impressions" />
                  <Bar yAxisId="left" dataKey="interactions" fill="#82ca9d" name="Interactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
      
      {selectedTab === 'searchTerms' && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Search Terms</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 text-left">Search Term</th>
                  <th className="py-2 px-4 text-left">Impressions</th>
                  <th className="py-2 px-4 text-left">Interactions</th>
                  <th className="py-2 px-4 text-left">Interaction Rate</th>
                  <th className="py-2 px-4 text-left">Cost (USD)</th>
                </tr>
              </thead>
              <tbody>
                {topSearchTerms.map((term, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2 px-4">{term.term}</td>
                    <td className="py-2 px-4">{term.impressions}</td>
                    <td className="py-2 px-4">{term.interactions}</td>
                    <td className="py-2 px-4">{term.interactionRate.toFixed(2)}%</td>
                    <td className="py-2 px-4">${term.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {selectedTab === 'campaigns' && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
          <div className="grid grid-cols-1 gap-6">
            {campaignData.map((campaign, index) => (
              <div key={index} className="border rounded p-4">
                <h4 className="font-medium text-lg mb-2">{campaign.campaign}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Impressions</p>
                    <p className="text-xl font-bold">{campaign.impressions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Interactions</p>
                    <p className="text-xl font-bold">{campaign.interactions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Interaction Rate</p>
                    <p className="text-xl font-bold">{campaign.interactionRate.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cost (USD)</p>
                    <p className="text-xl font-bold">${campaign.cost.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Recommendations</h3>
        <ul className="list-disc pl-5 text-blue-800">
          <li>Focus on top-performing search terms like "doing business in melbourne" and "melbourne media consulting"</li>
          <li>Consider adjusting bids for "strategy& melbourne" which has a high interaction rate (23.53%)</li>
          <li>Review and possibly exclude low-performing terms with high impressions but zero interactions</li>
          <li>Evaluate the performance difference between your two search campaigns to optimize budget allocation</li>
        </ul>
      </div>
    </div>
  );
}
