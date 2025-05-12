import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Search, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';

export default function SearchAdsDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const filtered = results.data.filter(row => row['Search term'] && !row['Search term'].includes('Total:'));
        setData(filtered);
      },
      error: (err) => setError(err.message),
    });
  };

  // Metrics
  const totalImpressions = _.sumBy(data, row => parseFloat(row['Impr.'] || 0));
  const totalInteractions = _.sumBy(data, row => parseFloat(row['Interactions'] || 0));
  const totalCost = _.sumBy(data, row => parseFloat(row['Cost (Converted currency)'] || 0));
  const avgCPC = totalCost / totalInteractions || 0;
  const conversionRate = (totalInteractions / totalImpressions) * 100 || 0;

  const campaignData = _.chain(data)
    .groupBy('Campaign')
    .map((items, campaign) => ({
      campaign,
      impressions: _.sumBy(items, row => parseFloat(row['Impr.'] || 0)),
      interactions: _.sumBy(items, row => parseFloat(row['Interactions'] || 0)),
      cost: _.sumBy(items, row => parseFloat(row['Cost (Converted currency)'] || 0)),
    }))
    .value();

  const topSearchTerms = _.chain(data)
    .sortBy(row => -(parseFloat(row['Interactions'] || 0)))
    .take(10)
    .map(row => ({
      term: row['Search term'],
      interactions: parseFloat(row['Interactions'] || 0),
    }))
    .value();

  const matchTypeData = _.chain(data)
    .groupBy('Match type')
    .map((items, type) => ({
      name: type,
      value: _.sumBy(items, row => parseFloat(row['Interactions'] || 0))
    }))
    .value();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Search Ads Dashboard</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} className="mb-4" />

      {error && <p className="text-red-600">{error}</p>}

      {data.length > 0 && (
        <>
          <div className="flex mb-6 space-x-4">
            {['overview', 'searchTerms', 'campaigns'].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 ${selectedTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {selectedTab === 'overview' && (
            <>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <KPI icon={<Search />} label="Impressions" value={totalImpressions.toLocaleString()} />
                <KPI icon={<CheckCircle />} label="Interactions" value={totalInteractions.toLocaleString()} />
                <KPI icon={<TrendingUp />} label="Interaction Rate" value={`${conversionRate.toFixed(2)}%`} />
                <KPI icon={<DollarSign />} label="Total Cost (USD)" value={`$${totalCost.toFixed(2)}`} />
                <KPI icon={<DollarSign />} label="Avg. CPC (USD)" value={`$${avgCPC.toFixed(2)}`} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-4 shadow rounded">
                  <h2 className="text-lg font-semibold mb-2">Top Search Terms</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topSearchTerms}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="term" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="interactions" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-4 shadow rounded">
                  <h2 className="text-lg font-semibold mb-2">Match Type Distribution</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={matchTypeData} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="value">
                        {matchTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* Additional tabs can be implemented similarly */}
        </>
      )}
    </div>
  );
}

function KPI({ icon, label, value }) {
  return (
    <div className="bg-white p-4 rounded shadow flex items-center">
      <div className="mr-4 text-blue-600">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
